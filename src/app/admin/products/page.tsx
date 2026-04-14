// TEMP TEST COMPONENT
"use client";

export function TestUpload() {
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);

    const res = await fetch("/api/test-upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    console.log(data);
    alert(JSON.stringify(data, null, 2));
  }

  return (
    <form onSubmit={handleSubmit}>
      <input type="file" name="file" required />
      <button type="submit">Upload</button>
    </form>
  );
}

export default function AdminProductsPage() {
  return <TestUpload />;
}

