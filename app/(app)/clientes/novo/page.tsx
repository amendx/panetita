import { PageHeader } from "@/components/layout/page-header";
import { NewCustomerForm } from "./new-customer-form";

export default function NovoClientePage() {
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Novo cliente" />
      <NewCustomerForm />
    </div>
  );
}
