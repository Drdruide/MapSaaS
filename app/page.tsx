import { GeneratorForm } from "@/components/GeneratorForm";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow">
        <GeneratorForm />
      </main>
    </div>
  );
}
