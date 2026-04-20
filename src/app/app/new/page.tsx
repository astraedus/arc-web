import CreateNoteForm from "@/components/CreateNoteForm";

export default function NewNotePage() {
  return (
    <div className="mx-auto max-w-3xl">
      <header className="pt-4 pb-12 text-center">
        <p className="text-[11px] uppercase tracking-[0.25em] text-warm-gray-light">
          a new entry
        </p>
        <p
          className="mt-3 text-lg italic text-warm-gray"
          style={{
            fontFamily:
              "'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif",
          }}
        >
          What&apos;s shifted?
        </p>
      </header>
      <CreateNoteForm />
    </div>
  );
}
