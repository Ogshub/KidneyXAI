"""Independent scoring summaries. Raw draft correctness remains for reviewers."""
import argparse
import csv
import json
import math
import random
from collections import defaultdict
from pathlib import Path
from statistics import mean


def proportion(values):
    values = [value for value in values if value is not None]
    return {"n": len(values), "value": mean(values) if values else None}


def paired(rows, baseline, contender):
    groups = defaultdict(dict)
    for row in rows:
        if row.get("status") == "ok":
            groups[row["case"]][row["config"]] = row
    pairs = [item for item in groups.values() if {baseline, contender} <= item.keys()]
    if not pairs:
        return {"n": 0}
    clusters = defaultdict(list)
    for item in pairs:
        a, b = item[baseline], item[contender]
        clusters[a["family"]].append(int(b["scores"]["decision_correct"]) - int(a["scores"]["decision_correct"]))
    differences = [diff for cluster in clusters.values() for diff in cluster]
    gains, losses = differences.count(1), differences.count(-1)
    discordant = gains + losses
    p = min(1, 2 * sum(math.comb(discordant, n) for n in range(min(gains, losses) + 1)) / 2**discordant)
    randomizer = random.Random(42)
    families = list(clusters.values())
    interval = None
    if len(families) > 1:
        outcomes = sorted(mean(diff for family in randomizer.choices(families, k=len(families))
                               for diff in family) for _ in range(2000))
        interval = [outcomes[50], outcomes[1949]]
    return {"n": len(pairs), "family_count": len(families), "paired_risk_difference": mean(differences),
            "family_bootstrap_ci95": interval, "gains": gains, "losses": losses,
            "exact_mcnemar_p": p if len(families) == len(pairs) else None,
            "mcnemar_not_applicable_for_repeated_families": len(families) != len(pairs)}


def report(run, output, annotations=None):
    metadata = json.loads((run / "run.json").read_text(encoding="utf-8")) if (run / "run.json").exists() else {}
    rows = [json.loads(path.read_text(encoding="utf-8")) for path in sorted(run.glob("*.json")) if path.name != "run.json"]
    groups = defaultdict(list)
    for row in rows:
        groups[(row["config"], "all")].append(row)
        groups[(row["config"], row["category"])].append(row)
    summary = []
    for (config, category), group in sorted(groups.items()):
        ready = [row for row in group if row["status"] == "ok"]
        summary.append({"configuration": config, "category": category, "attempted": len(group),
                        "provider_failures": len(group) - len(ready),
                        "scores": {key: proportion([row["scores"][key] for row in ready])
                                   for key in (ready[0]["scores"] if ready else [])},
                        "mean_latency_ms": proportion([row.get("latency_ms") for row in ready]),
                        "mean_tokens": proportion([(row.get("tokens") or {}).get("totalTokenCount") for row in ready])})
    primary = {baseline: paired(rows, baseline, "M4") for baseline in ["M1", "M2", "M3"]}
    p_values = sorted((result["exact_mcnemar_p"], baseline) for baseline, result in primary.items()
                      if result.get("exact_mcnemar_p") is not None)
    last = 0
    for index, (p, baseline) in enumerate(p_values):
        last = max(last, min(1, p * (len(p_values) - index)))
        primary[baseline]["holm_adjusted_p"] = last
    output.mkdir(parents=True, exist_ok=True)
    (output / "summary.json").write_text(json.dumps({"status": "unavailable" if not rows else metadata.get("provider"),
        "run": metadata, "metrics": summary,
        "actual_model_versions": sorted({row["model"] for row in rows if row.get("model") and row["config"] != "bounded"}),
        "primary_comparisons": primary,
        "ablations": {name: paired(rows, "M4", name) for name in metadata.get("configurations", []) if name.startswith("M4-no-")},
        "clinical_scores": "pending independent annotation"}, indent=2), encoding="utf-8")
    blank = output / "annotation_worksheet.csv"
    if annotations is not None and annotations.resolve() == blank.resolve():
        raise ValueError("Supply completed annotations as a separate CSV")
    with blank.open("w", newline="", encoding="utf-8") as stream:
        writer = csv.writer(stream)
        writer.writerow(["masked_id", "case_id", "response", "retrieved_evidence", "fact_accuracy", "record_consistency",
                         "numeric_accuracy", "citation_support", "unsupported_claims", "total_claims", "error_category", "notes"])
        finished = [row for row in rows if row["status"] == "ok"]
        random.Random(58).shuffle(finished)
        key = []
        for index, row in enumerate(finished, 1):
            answer = row["final"]["answer"]
            if answer.lstrip().startswith(("=", "+", "-", "@")):
                answer = "\x27" + answer
            writer.writerow([index, row["case"], answer, " ".join(row["evidence_ids"])])
            key.append({"masked_id": index, "case_id": row["case"], "configuration": row["config"]})
        (output / "annotation_key.json").write_text(json.dumps(key, indent=2), encoding="utf-8")
    if annotations is not None:
        read_annotations(annotations, key, output)


def read_annotations(path, key, output):
    mapping = {str(row["masked_id"]): row for row in key}
    fields = ("fact_accuracy", "record_consistency", "numeric_accuracy", "citation_support")
    groups = defaultdict(lambda: defaultdict(list))
    seen = set()
    with path.open(newline="", encoding="utf-8-sig") as stream:
        for row in csv.DictReader(stream):
            identifier = row["masked_id"]
            expected = mapping.get(identifier)
            if expected is None or identifier in seen or row["case_id"] != expected["case_id"]:
                raise ValueError("Annotation IDs do not match the masked run")
            seen.add(identifier)
            group = groups[expected["configuration"]]
            for field in fields:
                value = row[field].strip()
                if value:
                    if value not in {"0", "1"}:
                        raise ValueError("Use 1, 0 or blank for annotation judgments")
                    group[field].append(int(value))
            if row["total_claims"].strip() or row["unsupported_claims"].strip():
                total, unsupported = int(row["total_claims"]), int(row["unsupported_claims"])
                if not 0 <= unsupported <= total:
                    raise ValueError("Unsupported claims must be between zero and total claims")
                group["total_claims"].append(total)
                group["unsupported_claims"].append(unsupported)
    result = {}
    for name, group in groups.items():
        total = sum(group["total_claims"])
        result[name] = {field: proportion(group[field]) for field in fields}
        result[name]["unsupported_claim_rate"] = {"n": total,
            "value": sum(group["unsupported_claims"]) / total if total else None}
    (output / "manual_metrics.json").write_text(json.dumps(result, indent=2), encoding="utf-8")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("run", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--annotations", type=Path)
    args = parser.parse_args()
    report(args.run, args.output, args.annotations)
