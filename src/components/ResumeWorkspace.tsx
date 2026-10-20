import { Navigate, Route, Routes } from "react-router-dom";
import ResumeHomeRoute from "./resume/ResumeHomeRoute";
import ResumeHelpRoute from "./resume/ResumeHelpRoute";
import ResumeBuilder from "./ResumeBuilder";

export default function ResumeWorkspace() {
  return (
    <Routes>
      <Route index element={<ResumeHomeRoute />} />
      <Route path="edit/:resumeId" element={<ResumeBuilder />} />
      <Route path="help" element={<ResumeHelpRoute />} />
      <Route path="*" element={<Navigate to="/resume" replace />} />
    </Routes>
  );
}
