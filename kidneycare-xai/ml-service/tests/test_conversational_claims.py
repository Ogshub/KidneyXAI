import pytest
from app.assistant import Claim, Draft, verify_claims


@pytest.mark.parametrize("identifier,text,expected", [
    ("lab", "Recorded value 1.2 mg/dL on 2025-10-01.", True),
    ("lab", "Recorded value 1.3 mg/dL on 2025-10-01.", False),
    ("lab", "Recorded value 1.2 mg/dL on 2025-10-02.", False),
    ("invented", "Recorded value 1.2 mg/dL on 2025-10-01.", False),
    ("source", "An unsupported diagnosis.", False),
])
def test_conversational_claims_match_authorized_material(identifier, text, expected):
    draft = Draft(presentation="observations", claims=[Claim(id=identifier, text=text)])
    assert verify_claims(draft, {"lab": "Recorded value 1.2 mg/dL on 2025-10-01."},
                         {"source": {"text": "Reviewed educational text."}}) is expected


def test_duplicate_claim_is_rejected():
    claim = Claim(id="source", text="Reviewed educational text.")
    draft = Draft(presentation="summary", claims=[claim, claim])
    assert not verify_claims(draft, {}, {"source": {"text": claim.text}})
