"""Unit tests for source-backed lead validation rules."""

from modal.lead_validation import (
    LeadEvidence,
    build_provenance,
    contact_completeness,
    contact_confidence,
    is_public_source_url,
    should_save_lead,
    source_confidence,
)
from modal.scraper_tiered import _extract_company_from_html


def test_requires_company_and_real_source_before_saving() -> None:
    assert should_save_lead(
        LeadEvidence(company_name="Acme Ltd", source_url="https://acme.example/contact")
    )
    assert not should_save_lead(LeadEvidence(company_name="Acme Ltd"))
    assert not should_save_lead(
        LeadEvidence(company_name="", source_url="https://acme.example/contact")
    )
    assert not should_save_lead(
        LeadEvidence(company_name="Acme Ltd", source_url="acme.example/contact")
    )


def test_registry_source_has_higher_provenance_confidence() -> None:
    registry = LeadEvidence(company_name="Acme Ltd", source_url="registry://companies_house")
    webpage = LeadEvidence(company_name="Acme Ltd", source_url="https://acme.example/about")

    assert source_confidence(registry) == 100.0
    assert source_confidence(webpage) == 85.0
    assert source_confidence(LeadEvidence(company_name="Acme Ltd")) == 0.0


def test_confidence_only_counts_explicit_fields() -> None:
    complete = LeadEvidence(
        company_name="Acme Ltd",
        contact_name="Jane Doe",
        title="Operations Director",
        email="jane@acme.example",
        phone="+1 555 0100",
        website="https://acme.example",
        source_url="https://acme.example/team",
    )
    company_only = LeadEvidence(
        company_name="Acme Ltd",
        website="https://acme.example",
        source_url="https://acme.example",
    )

    assert contact_confidence(complete) == 100.0
    assert contact_confidence(company_only) == 20.0
    assert contact_completeness(complete) == 100.0
    assert contact_completeness(company_only) == 33.33


def test_provenance_never_marks_inferred_email_as_published() -> None:
    evidence = LeadEvidence(
        company_name="Acme Ltd",
        contact_name="Jane Doe",
        source_url="https://acme.example/team",
    )

    provenance = build_provenance(evidence)

    assert provenance["email_explicitly_published"] is False
    assert provenance["email_inferred"] is False
    assert provenance["source_url"] == "https://acme.example/team"


def test_source_url_validation_rejects_unqualified_or_empty_values() -> None:
    assert is_public_source_url("https://acme.example/contact")
    assert is_public_source_url("registry://companies_house")
    assert not is_public_source_url("")
    assert not is_public_source_url("acme.example/contact")
    assert not is_public_source_url("https://")


def test_scraper_keeps_explicit_contact_email_and_exact_source_page() -> None:
    html = """
    <html>
      <head><title>Acme Ltd</title></head>
      <body>
        <article class="team-member">
          <h3>Jane Doe</h3>
          <p class="role">Operations Director</p>
          <a href="mailto:jane@acme.example">Email Jane</a>
        </article>
      </body>
    </html>
    """

    page_url = "https://acme.example/team"
    company = _extract_company_from_html(html, page_url)

    assert len(company.contacts) == 1
    assert company.contacts[0].name == "Jane Doe"
    assert company.contacts[0].title == "Operations Director"
    assert company.contacts[0].email == "jane@acme.example"
    assert company.contacts[0].source_url == page_url
