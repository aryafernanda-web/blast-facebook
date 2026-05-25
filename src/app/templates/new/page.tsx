import { TemplateForm } from "../TemplateForm";

export default function NewTemplatePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Template baru</h1>
      <div className="card">
        <TemplateForm />
      </div>
    </div>
  );
}
