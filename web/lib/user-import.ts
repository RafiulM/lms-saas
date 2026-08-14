export type CreateUserInput = {
  name: string;
  email: string;
  password: string;
  role: "teacher" | "student";
  className?: string;
};

/** Mengurai teks tempelan dari Excel: tiap baris "Nama<tab>email<tab>sandi<tab>peran" */
export function parseUserLines(text: string): CreateUserInput[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [name, email, password = "password123", roleRaw = "student"] = line.split(/\t|,|;/);
      return {
        name: name?.trim() ?? "",
        email: email?.trim() ?? "",
        password: password.trim(),
        role: roleRaw.trim().toLowerCase() === "guru" || roleRaw.trim().toLowerCase() === "teacher" ? "teacher" : "student",
      } as CreateUserInput;
    });
}
