import FlowStep from "../flow-step";
import Questionnaire from "../questionnaire";

export const metadata = { title: "Kuesioner SUS" };

const statements = [
  "Saya ingin menggunakan sistem ini lagi.",
  "Menurut saya, penggunaan sistem ini terasa rumit.",
  "Menurut saya, sistem ini mudah digunakan.",
  "Saya perlu bantuan orang lain atau teknisi untuk menggunakan sistem ini.",
  "Fitur-fitur pada sistem ini berfungsi sebagaimana mestinya.",
  "Menurut saya, banyak bagian sistem ini yang tidak konsisten.",
  "Saya rasa orang lain bisa cepat memahami cara memakai sistem ini.",
  "Sistem ini membuat saya bingung saat menggunakannya.",
  "Saya dapat menggunakan sistem ini tanpa kendala.",
  "Sebelum dapat menggunakan sistem ini, saya perlu membiasakan diri dengannya.",
];

export default function Page() {
  return (
    <FlowStep step="sus-form" title="Kuesioner SUS">
      {() => <Questionnaire
        idPrefix="sus"
        lang="id"
        title="Kuesioner System Usability Scale (SUS)"
        instructions="Berdasarkan pengalaman Anda menggunakan TopORME, pilih satu jawaban untuk setiap pernyataan."
        statements={statements}
      />}
    </FlowStep>
  );
}
