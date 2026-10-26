from __future__ import annotations

import csv
import tempfile
import unittest
import zipfile
from pathlib import Path

from report_builder import build_report, inspect_source


class ReportBuilderTest(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory()
        self.workspace = Path(self.temporary.name)
        with (self.workspace / "data.csv").open(
            "w", encoding="utf-8", newline=""
        ) as handle:
            writer = csv.DictWriter(
                handle,
                fieldnames=("project", "status", "progress", "next_step", "owner"),
            )
            writer.writeheader()
            writer.writerow(
                {
                    "project": "Onboarding",
                    "status": "On track",
                    "progress": "Pilot ready",
                    "next_step": "Invite users",
                    "owner": "Lin",
                }
            )
            writer.writerow(
                {
                    "project": "Export",
                    "status": "Blocked",
                    "progress": "Schema ready",
                    "next_step": "Request access",
                    "owner": "Wang",
                }
            )

    def tearDown(self) -> None:
        self.temporary.cleanup()

    def test_inspect_source_returns_bounded_summary(self) -> None:
        result = inspect_source(self.workspace, "data.csv")
        self.assertEqual(result["row_count"], 2)
        self.assertEqual(result["status_counts"], {"Blocked": 1, "On track": 1})
        self.assertEqual(result["owners"], ["Lin", "Wang"])

    def test_paths_cannot_escape_workspace(self) -> None:
        with self.assertRaisesRegex(ValueError, "escapes REPORT_WORKSPACE"):
            inspect_source(self.workspace, "../private.csv")

    def test_missing_required_column_is_rejected(self) -> None:
        (self.workspace / "bad.csv").write_text(
            "project,status\nA,On track\n", encoding="utf-8"
        )
        with self.assertRaisesRegex(ValueError, "missing required columns"):
            inspect_source(self.workspace, "bad.csv")

    def test_build_report_creates_verified_docx(self) -> None:
        result = build_report(
            self.workspace,
            "data.csv",
            "weekly-report.docx",
            "2026-09-04",
            "Team weekly report",
        )
        output = self.workspace / result["output"]
        self.assertEqual(result["row_count"], 2)
        self.assertEqual(len(result["sha256"]), 64)
        with zipfile.ZipFile(output) as archive:
            document_xml = archive.read("word/document.xml").decode("utf-8")
        self.assertIn("Team weekly report", document_xml)
        self.assertIn("Request access", document_xml)

    def test_existing_output_requires_explicit_overwrite(self) -> None:
        output = self.workspace / "weekly-report.docx"
        output.write_bytes(b"existing")
        with self.assertRaisesRegex(FileExistsError, "overwrite=true"):
            build_report(
                self.workspace,
                "data.csv",
                output.name,
                "2026-09-04",
            )
        self.assertEqual(output.read_bytes(), b"existing")


if __name__ == "__main__":
    unittest.main()
