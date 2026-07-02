import shutil
import subprocess
from pathlib import Path
from uuid import uuid4

from app.core.config import settings

OFFICE_EXTENSIONS = {".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx"}


def ensure_binary(binary: str) -> None:
    if not shutil.which(binary):
        raise RuntimeError(f"Required binary not found: {binary}")


def convert_file(input_path: Path, target_format: str) -> Path:
    target = target_format.lower().lstrip(".")
    suffix = input_path.suffix.lower()
    output_dir = settings.storage_path / "outputs" / str(uuid4())
    output_dir.mkdir(parents=True, exist_ok=True)

    if target == "pdf" and suffix in OFFICE_EXTENSIONS:
        return office_to_pdf(input_path, output_dir)
    if target == "pdf" and suffix in {".html", ".htm"}:
        return html_to_pdf(input_path, output_dir)
    if target in {"png", "jpg", "jpeg"} and suffix == ".pdf":
        return pdf_to_images(input_path, output_dir, target)
    if suffix == ".pdf" and target in {"docx", "xlsx", "pptx"}:
        return pdf_to_office_beta(input_path, output_dir, target)

    if settings.commercial_convert_enabled:
        return commercial_convert(input_path, output_dir, target)

    raise RuntimeError(f"Unsupported conversion: {suffix} to {target}")


def office_to_pdf(input_path: Path, output_dir: Path) -> Path:
    ensure_binary("libreoffice")
    subprocess.run(
        ["libreoffice", "--headless", "--convert-to", "pdf", "--outdir", str(output_dir), str(input_path)],
        check=True,
        capture_output=True,
        text=True,
        timeout=120,
    )
    output = output_dir / f"{input_path.stem}.pdf"
    if not output.exists():
        raise RuntimeError("LibreOffice did not produce a PDF")
    return output


def html_to_pdf(input_path: Path, output_dir: Path) -> Path:
    script = Path(__file__).with_name("html_to_pdf.py")
    output = output_dir / f"{input_path.stem}.pdf"
    subprocess.run(["python", str(script), str(input_path), str(output)], check=True, capture_output=True, text=True, timeout=120)
    return output


def pdf_to_images(input_path: Path, output_dir: Path, target: str) -> Path:
    ensure_binary("pdftoppm")
    image_ext = "jpeg" if target in {"jpg", "jpeg"} else "png"
    prefix = output_dir / input_path.stem
    command = ["pdftoppm", f"-{image_ext}", "-r", "160", str(input_path), str(prefix)]
    subprocess.run(command, check=True, capture_output=True, text=True, timeout=120)
    first = next(output_dir.glob(f"*.{target if target != 'jpg' else 'jpg'}"), None)
    if not first:
        first = next(output_dir.glob("*"), None)
    if not first:
        raise RuntimeError("Poppler did not produce images")
    return first


def pdf_to_office_beta(input_path: Path, output_dir: Path, target: str) -> Path:
    if not settings.commercial_convert_enabled:
        raise RuntimeError("PDF to Office is beta and requires COMMERCIAL_CONVERT_ENABLED=true for v1")
    return commercial_convert(input_path, output_dir, target)


def commercial_convert(input_path: Path, output_dir: Path, target: str) -> Path:
    raise RuntimeError("Commercial conversion adapter is reserved but not configured in v1")
