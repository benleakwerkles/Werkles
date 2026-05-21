import { readStaticBody } from "@/lib/static-page";

export default function ProofPage() {
  return <div dangerouslySetInnerHTML={{ __html: readStaticBody("proof.html") }} />;
}
