from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
from fpdf import FPDF
import tempfile
import os
from fastapi.responses import FileResponse

router = APIRouter()

class StoryRequest(BaseModel):
    patientName: str
    patientAge: int
    dementiaType: str
    memories: List[dict]
    sessions: List[dict]

@router.post("/life-story")
async def generate_life_story(req: StoryRequest):
    try:
        pdf = FPDF()
        pdf.set_auto_page_break(auto=True, margin=15)
        pdf.add_page()

        # Title
        pdf.set_font("Helvetica", "B", 24)
        pdf.set_text_color(108, 99, 255)
        pdf.cell(0, 15, "GriefBridge", new_x="LMARGIN", new_y="NEXT", align="C")

        pdf.set_font("Helvetica", "", 11)
        pdf.set_text_color(107, 114, 128)
        pdf.cell(0, 8, "A Life Story Preserved With Love", new_x="LMARGIN", new_y="NEXT", align="C")
        pdf.ln(8)

        # Patient Name
        pdf.set_font("Helvetica", "B", 22)
        pdf.set_text_color(26, 26, 46)
        pdf.cell(0, 12, f"The Life of {req.patientName}", new_x="LMARGIN", new_y="NEXT", align="C")

        pdf.set_font("Helvetica", "", 11)
        pdf.set_text_color(107, 114, 128)
        pdf.cell(0, 8, f"Age {req.patientAge}  |  {req.dementiaType.capitalize()} Dementia", new_x="LMARGIN", new_y="NEXT", align="C")
        pdf.ln(10)

        # Divider
        pdf.set_draw_color(108, 99, 255)
        pdf.set_line_width(0.5)
        pdf.line(20, pdf.get_y(), 190, pdf.get_y())
        pdf.ln(10)

        # Introduction
        pdf.set_font("Helvetica", "B", 13)
        pdf.set_text_color(108, 99, 255)
        pdf.cell(0, 8, "About This Person", new_x="LMARGIN", new_y="NEXT")
        pdf.ln(2)

        pdf.set_font("Helvetica", "", 11)
        pdf.set_text_color(26, 26, 46)
        intro = f"{req.patientName} has lived a rich and meaningful life. This book is a collection of their memories, stories, and the moments that made them who they are. Compiled with love by their family using GriefBridge."
        pdf.multi_cell(0, 7, intro)
        pdf.ln(8)

        # Memories by decade
        decades = {}
        for memory in req.memories:
            decade = memory.get("decade", "Unknown")
            if decade not in decades:
                decades[decade] = []
            decades[decade].append(memory)

        if decades:
            pdf.set_font("Helvetica", "B", 13)
            pdf.set_text_color(108, 99, 255)
            pdf.cell(0, 8, "Memories Through the Years", new_x="LMARGIN", new_y="NEXT")
            pdf.ln(3)

            for decade in sorted(decades.keys()):
                mems = decades[decade]
                pdf.set_font("Helvetica", "B", 11)
                pdf.set_text_color(26, 26, 46)
                pdf.cell(0, 7, f"The {decade}", new_x="LMARGIN", new_y="NEXT")

                for mem in mems:
                    tags = ", ".join(mem.get("tags", []))
                    mem_type = mem.get("type", "memory").capitalize()
                    transcript = mem.get("transcript", "")

                    pdf.set_font("Helvetica", "", 10)
                    pdf.set_text_color(107, 114, 128)

                    line = f"  {mem_type}"
                    if tags:
                        line += f" - {tags}"
                    pdf.cell(0, 6, line, new_x="LMARGIN", new_y="NEXT")

                    if transcript:
                        short = transcript[:150] + "..." if len(transcript) > 150 else transcript
                        pdf.set_font("Helvetica", "I", 10)
                        pdf.multi_cell(0, 6, f'    "{short}"')
                pdf.ln(4)

        # Sessions
        if req.sessions:
            pdf.add_page()
            pdf.set_font("Helvetica", "B", 13)
            pdf.set_text_color(108, 99, 255)
            pdf.cell(0, 8, "Moments of Connection", new_x="LMARGIN", new_y="NEXT")
            pdf.ln(3)

            pdf.set_font("Helvetica", "", 11)
            pdf.set_text_color(26, 26, 46)
            pdf.multi_cell(0, 7, "These are the real moments when connection was felt during visits.")
            pdf.ln(5)

            total_positive = 0
            total_sessions = len(req.sessions)

            for session in req.sessions:
                for r in session.get("responses", []):
                    if r.get("reaction") in ["smile", "word", "eye_contact"]:
                        total_positive += 1
                        reaction = r.get("reaction", "").replace("_", " ").title()
                        prompt = r.get("prompt", "")[:100]
                        pdf.set_font("Helvetica", "", 10)
                        pdf.set_text_color(26, 26, 46)
                        pdf.multi_cell(0, 6, f"  {reaction}: \"{prompt}\"")

            pdf.ln(6)
            pdf.set_font("Helvetica", "B", 11)
            pdf.set_text_color(108, 99, 255)
            pdf.cell(0, 8, f"Total: {total_sessions} visits  |  {total_positive} moments of connection", new_x="LMARGIN", new_y="NEXT")

        # Closing page
        pdf.add_page()
        pdf.ln(30)
        pdf.set_font("Helvetica", "B", 18)
        pdf.set_text_color(108, 99, 255)
        pdf.cell(0, 12, "A Message of Love", new_x="LMARGIN", new_y="NEXT", align="C")
        pdf.ln(8)

        pdf.set_font("Helvetica", "I", 11)
        pdf.set_text_color(26, 26, 46)
        closing = f"To everyone who loved {req.patientName} - thank you for every visit, every song, every memory you shared. The connection you built together is real, and it matters more than words can say."
        pdf.multi_cell(0, 8, closing, align="C")
        pdf.ln(12)

        pdf.set_font("Helvetica", "B", 13)
        pdf.set_text_color(108, 99, 255)
        pdf.cell(0, 10, "Made with love using GriefBridge", new_x="LMARGIN", new_y="NEXT", align="C")

        # Save PDF
        out_path = os.path.join(
            tempfile.gettempdir(),
            f"life_story_{req.patientName.replace(' ', '_')}.pdf"
        )
        pdf.output(out_path)

        return FileResponse(
            path=out_path,
            media_type="application/pdf",
            filename=f"{req.patientName}_Life_Story.pdf"
        )

    except Exception as e:
        print(f"PDF Error: {str(e)}")
        return {"success": False, "error": str(e)}