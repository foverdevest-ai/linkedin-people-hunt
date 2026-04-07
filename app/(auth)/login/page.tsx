import { LoginForm } from "@/app/(auth)/login/LoginForm";

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  return (
    <div className="container-shell py-10">
      <LoginForm nextPath={params.next || "/dashboard"} />
    </div>
  );
}
