import CreateNoteForm from "@/components/CreateNoteForm";

export default function NewNotePage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">New note</h1>
        <p className="mt-1 text-sm text-warm-gray">
          Write it down. It will sync to your phone.
        </p>
      </div>
      <CreateNoteForm />
    </div>
  );
}
