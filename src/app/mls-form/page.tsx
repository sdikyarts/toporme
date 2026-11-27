import FlowStep from "../flow-step";
import Questionnaire from "../questionnaire";

const statements = [
  "I choose to use AI for assignments so I don’t have to think too hard.",
  "In my courses, I want AI to handle the difficult thinking for me.",
  "If content seems too complex, I just ask AI to explain it.",
  "I don’t develop my own study strategies when I can use AI instead.",
  "I avoid challenging learning tasks when AI can do them for me.",
  "I want to do well in my courses, but only if AI can handle the difficult parts.",
];

const ratings = [
  "not at all true of me",
  "slightly true of me",
  "moderately true of me",
  "mostly true of me",
  "very true of me",
];

export default function Page() {
  return (
    <FlowStep step="mls-form" title="Metacognitive Laziness Scale">
      <Questionnaire
        idPrefix="mls"
        lang="en"
        title="Metacognitive Laziness Scale (MLS)"
        introduction={
          <p lang="id" translate="no">
            Kuesioner ini disajikan dalam bahasa Inggris. Jika diperlukan, Anda dapat menggunakan fitur
            terjemahan bawaan peramban. Hasil terjemahan otomatis mungkin kurang akurat.
          </p>
        }
        instructions="Different students have different approaches to using AI in their learning. Please rate how true each statement is of you:"
        statements={statements}
        ratings={ratings}
        source={{ href: "https://doi.org/10.1177/20965311261450994", label: "Scale development paper by Dizon et al." }}
      />
    </FlowStep>
  );
}
