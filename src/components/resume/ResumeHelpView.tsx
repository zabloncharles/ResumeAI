export default function ResumeHelpView() {
  return (
    <div className="p-6">
      <div className="max-w-4xl">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
          Resume Builder Help
        </h2>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          How to use Ivy-style templates, AI, and ATS Check to build a resume
          that reads well for people and applicant tracking systems.
        </p>

        <div className="space-y-6">
          <section className="bg-white dark:bg-zinc-950 rounded-xl border border-gray-200 dark:border-zinc-800 p-5">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
              Getting started
            </h3>
            <ul className="list-disc pl-5 text-zinc-600 dark:text-zinc-300 space-y-1 text-sm">
              <li>
                From <strong className="font-medium text-zinc-800 dark:text-zinc-200">Home</strong>, create a resume or open an existing one. Each card shows your title and template name.
              </li>
              <li>
                Open the <strong className="font-medium text-zinc-800 dark:text-zinc-200">Templates</strong> page from the app menu to compare Ivy layouts before you edit.
              </li>
              <li>
                In the editor, use the left sidebar sections to add content. The right side shows a live PDF preview that matches what you download.
              </li>
            </ul>
          </section>

          <section className="bg-white dark:bg-zinc-950 rounded-xl border border-gray-200 dark:border-zinc-800 p-5">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
              Ivy templates & school
            </h3>
            <ul className="list-disc pl-5 text-zinc-600 dark:text-zinc-300 space-y-1 text-sm">
              <li>
                In the editor, open <strong className="font-medium text-zinc-800 dark:text-zinc-200">Ivy templates</strong>. Use the <strong className="font-medium text-zinc-800 dark:text-zinc-200">School</strong> dropdown (Harvard MCS, Princeton, Yale, Brown, Cornell) to filter templates for that career center.
              </li>
              <li>
                Pick the layout that matches your goal: for example Harvard MCS Bullet Point (education first), Experience First (industry), Princeton role-header lines, Yale with summary at the top, or Brown without a summary block on the PDF.
              </li>
              <li>
                Your choice is saved with the resume and drives PDF section order, styling, and AI writing rules.
              </li>
            </ul>
          </section>

          <section className="bg-white dark:bg-zinc-950 rounded-xl border border-gray-200 dark:border-zinc-800 p-5">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
              How to build a strong resume (best order)
            </h3>
            <ol className="list-decimal pl-5 text-zinc-600 dark:text-zinc-300 space-y-2 text-sm">
              <li>
                <span className="font-medium text-zinc-800 dark:text-zinc-200">Choose template first.</span>{" "}
                Section order and summary rules depend on the school style you select.
              </li>
              <li>
                <span className="font-medium text-zinc-800 dark:text-zinc-200">Personal information.</span>{" "}
                Use a professional email and phone. Skip photos; Ivy PDFs do not include them and ATS systems prefer plain text.
              </li>
              <li>
                <span className="font-medium text-zinc-800 dark:text-zinc-200">Experience.</span>{" "}
                Add each role with company, title, and dates (YYYY-MM in the editor). Write 2–4 bullets per job with strong action verbs and numbers where you can prove them. Expand one job at a time in the accordion. Remove duplicate bullets if you reuse text.
              </li>
              <li>
                <span className="font-medium text-zinc-800 dark:text-zinc-200">Education.</span>{" "}
                List degrees reverse chronological order. Match the level of detail your template expects.
              </li>
              <li>
                <span className="font-medium text-zinc-800 dark:text-zinc-200">Professional summary.</span>{" "}
                For Harvard MCS, Yale Resume 1, Cornell, and Brown early-career layouts, leave this blank unless an advisor asks for one. Use Yale “With Summary” or “Technical” templates if you want a summary near the top.
              </li>
              <li>
                <span className="font-medium text-zinc-800 dark:text-zinc-200">Skills.</span>{" "}
                List concrete tools, languages, and methods—not vague traits like “team player.” Show soft skills through experience bullets instead.
              </li>
              <li>
                <span className="font-medium text-zinc-800 dark:text-zinc-200">Websites & links.</span>{" "}
                Add LinkedIn, portfolio, or GitHub when relevant. Keep URLs short and professional.
              </li>
              <li>
                <span className="font-medium text-zinc-800 dark:text-zinc-200">ATS Check.</span>{" "}
                Run a check (see below), apply quick fixes, then download PDF when score and recommendations look good.
              </li>
            </ol>
            <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
              Think of the resume as a tight narrative of proof, not a long essay. Every line should earn its space; tailor bullets toward the roles you want.
            </p>
          </section>

          <section className="bg-white dark:bg-zinc-950 rounded-xl border border-gray-200 dark:border-zinc-800 p-5">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
              AI suggestions
            </h3>
            <ul className="list-disc pl-5 text-zinc-600 dark:text-zinc-300 space-y-1 text-sm">
              <li>
                In <strong className="font-medium text-zinc-800 dark:text-zinc-200">Professional Summary</strong> and under each job’s <strong className="font-medium text-zinc-800 dark:text-zinc-200">Key Achievements</strong>, use Generate Suggestions (sign-in required).
              </li>
              <li>
                Prompts follow your selected Ivy template—for example MCS-style bullets, Princeton wording, or Brown headlines instead of a summary when that template discourages one.
              </li>
              <li>
                Treat AI output as a draft. Edit for accuracy; never publish metrics or employers you did not actually have.
              </li>
            </ul>
          </section>

          <section className="bg-white dark:bg-zinc-950 rounded-xl border border-gray-200 dark:border-zinc-800 p-5">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
              ATS Check
            </h3>
            <ul className="list-disc pl-5 text-zinc-600 dark:text-zinc-300 space-y-1 text-sm">
              <li>
                Open the <strong className="font-medium text-zinc-800 dark:text-zinc-200">ATS Check</strong> section below Websites & Social Links.
              </li>
              <li>
                Confirm consent, then run the check. Your full resume content is analyzed against ATS habits and your Ivy template guidelines.
              </li>
              <li>
                Review the score, strengths, Ivy template fit notes, and prioritized fixes. Use quick fixes (clear summary, dedupe bullets, clear stored photo) when offered.
              </li>
              <li>
                Re-run after edits. The check is AI-guided guidance, not a guarantee any employer system will parse your file perfectly.
              </li>
            </ul>
          </section>

          <section className="bg-white dark:bg-zinc-950 rounded-xl border border-gray-200 dark:border-zinc-800 p-5">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
              Preview & download
            </h3>
            <ul className="list-disc pl-5 text-zinc-600 dark:text-zinc-300 space-y-1 text-sm">
              <li>
                Live preview on the right is the same PDF engine used for download—what you see is what you export.
              </li>
              <li>
                Use <strong className="font-medium text-zinc-800 dark:text-zinc-200">Download PDF</strong> in the editor header. Filename should include your name; avoid special characters.
              </li>
              <li>
                Long bullets wrap with a hanging indent so continued lines align under the text, not the page margin.
              </li>
            </ul>
          </section>

          <section className="bg-white dark:bg-zinc-950 rounded-xl border border-gray-200 dark:border-zinc-800 p-5">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
              Saving & sync
            </h3>
            <ul className="list-disc pl-5 text-zinc-600 dark:text-zinc-300 space-y-1 text-sm">
              <li>
                Edits auto-save locally after a short pause while you type.
              </li>
              <li>
                When signed in, use the save control in the header to sync to the cloud. Template choice and content stay with that resume document.
              </li>
              <li>
                If you change school or template, save so Home shows the correct template name on your card.
              </li>
            </ul>
          </section>

          <section className="bg-white dark:bg-zinc-950 rounded-xl border border-gray-200 dark:border-zinc-800 p-5">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
              Cover letters
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              Cover letters are separate from the resume PDF. Use the Cover Letter flow in the app when you need a tailored letter; keep the resume factual and one page, and use the letter to explain fit and motivation in prose.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
