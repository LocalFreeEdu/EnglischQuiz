import { Component, HostListener, ViewChild, ElementRef, OnInit, ChangeDetectorRef,} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { log } from 'node:console';

interface Vocabulary {
  en: string[];
  de: string;
  topic?: string;
  isNew?: boolean;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {

  @ViewChild('answerInput')
  answerInput!: ElementRef<HTMLInputElement>;

  @HostListener('document:keydown', ['$event'])
  handleEnter(event: KeyboardEvent) {

    if (event.key !== 'Enter') {
      return;
    }

    event.preventDefault();
    if(this.endofquiz){
      this.startQuiz();
    }
    else{
      if (!this.answerLocked) {
        this.checkAnswer();
      } else {
        this.nextQuestion();
      }
    }
  }

  nextButtonColor = '#4CAF50';
  progressCells: string[] = [];
  vocab: Vocabulary[] = [];

  quizList: Vocabulary[] = [];
  index = 0;
  endofquiz = false;
  isTopicMode = false;

  answer = '';

  correct = 0;
  partial = 0;
  wrong = 0;

  answerLocked = false;
  feedback = '';

  constructor(private cdr: ChangeDetectorRef) {
    
  }

 ngOnInit(): void {

//Nichts zu tun

}

startQuiz() {

  this.endofquiz = false;

    this.quizList = [];

    this.progressCells = Array(15).fill('gray');


    if (this.isTopicMode) {
      // Themenmodus
      //console.log'startQuiz: Themenmodus');
      const topicOrder = this.getTopicOrder();

      while (this.quizList.length < 15) {
        for (const topic of topicOrder) {

          //Abbruchbedingung
          if (this.quizList.length >= 15) {
          break;
          }

          const topicEntries =
            this.vocab.filter(
              v =>
                v.topic === topic &&
                !this.quizList.includes(v)
            );

          if (topicEntries.length === 0) {
            continue;
          }

          const randomEntry =
            topicEntries[
              Math.floor(
                Math.random() *
                topicEntries.length
              )
            ];

          /*console.log(
            topic,
            topicEntries.length
          );*/

          this.quizList.push(
            randomEntry
          );
        }
      }

      /*console.log(
        'QuizList:',
        this.quizList.length
      );*/

    }
    else {
      //Vokabelmodus
      //console.log('startQuiz: Vokabelmodus');

      const newWords =
      this.vocab.filter(v => v.isNew);

      const oldWords =
        this.vocab.filter(v => !v.isNew);

      if (newWords.length > 0) {

        const selectedNew = [...newWords]
          .sort(() => Math.random() - 0.5)
          .slice(0, 10);

        const selectedOld = [...oldWords]
          .sort(() => Math.random() - 0.5)
          .slice(0, 5);

        this.quizList = [
          ...selectedNew,
          ...selectedOld
        ]
        .sort(() => Math.random() - 0.5);

      } else {

        // Alte CSV-Datei ohne dritte Spalte
        this.quizList = [...this.vocab]
          .sort(() => Math.random() - 0.5)
          .slice(0, 15);
      }

    }

      this.index = 0;
      this.correct = 0;
      this.partial = 0;
      this.wrong = 0;

      this.answer = '';
      this.feedback = '';
      this.answerLocked = false;

    //this.focusInput();

this.cdr.detectChanges();
}

  normalize(text: string): string {
    return text
      .trim()
      .replace(/[´`‘’‚‛‹›ʻʼʹ]/g, "'")
      .replace(/…/g, "...")
      .replace(/^to\s+/i, '');
  }

  normalizeLower(text: string): string {
    return this.normalize(text).toLowerCase();
  }

  removeBrackets(text: string) {
    return text.replace(/\(.*?\)/g, '').trim();
  }

  removeSpaces(text: string) {
    return text.replace(/\s+/g, '');
  }

  removePunctuation(text: string) {
    return text.replace(/[.,!?;:]/g, '').trim();
  }

  checkAnswer() {

    if (!this.answer || this.answer.trim() === '') {
    //Nichts machen
    return;
    }
    else {

      const possibleAnswers = this.quizList[this.index].en;

      // Standardmäßig gehen wir davon aus,
      // dass die Antwort falsch ist.
      let result = 'wrong';

      // Benutzerantwort normalisieren
      const userExact =
        this.normalize(this.answer);

      // Groß-/Kleinschreibung ignorieren
      const userLower =
        this.normalizeLower(this.answer);

      // Prüfe die Benutzereingabe gegen alle
      // möglichen richtigen englischen Antworten.
      // Das können die Hauptlösung und beliebige
      // Alternativlösungen aus der CSV sein.
      for (const correctRaw of possibleAnswers) {



        // Aktuelle korrekte Antwort normalisieren
        const correctExact =
          this.normalize(correctRaw);



        const correctLower =
          this.normalizeLower(correctRaw);

        // Klammern entfernen
        const noBrackets =
          this.normalizeLower(
            this.removeBrackets(correctRaw)
          );

        // Satzzeichen entfernen
        const noPunct =
          this.normalizeLower(
            this.removePunctuation(correctRaw)
          );

        // Leerzeichen entfernen
        const noSpaces =
          this.normalizeLower(
            this.removeSpaces(correctRaw)
          );

        // Exakte Übereinstimmung:
        // Antwort komplett korrekt
        if (userExact === correctExact) {
          result = 'correct';

          // Weitere Alternativen müssen
          // nicht mehr geprüft werden.
          break;
        }

        // Falls die Antwort bisher noch falsch war,
        // prüfen wir auf "teilweise richtig".
        // Dabei werden Groß-/Kleinschreibung,
        // Klammern, Satzzeichen oder Leerzeichen
        // toleriert.
        if (
          result === 'wrong' &&
          (
            userLower === correctLower ||
            userLower === noBrackets ||
            userLower === noPunct ||
            this.removeSpaces(userLower) === noSpaces
          )
        ) {
          result = 'partial';
        }
      }
      
      const displayAnswer =
      possibleAnswers.join(' | ');

      if (result === 'correct') {

        this.correct++;

        this.updateProgressBar('correct');

        this.nextQuestion();

      } else {

        this.answerLocked = true;

        if (result === 'partial') {

          this.partial++;

          this.updateProgressBar('partial');

          this.nextButtonColor = '#FF9800';

          this.feedback =
            `Teilweise richtig. Richtige Antwort: ${displayAnswer}`;

        } else {

          this.wrong++;

          this.updateProgressBar('wrong');

          this.nextButtonColor = '#f44336';

          this.feedback =
            `Falsch. Richtige Antwort: ${displayAnswer}`;
        }
      }


    }
  }

  nextQuestion() {

    if( this.index < 14) {

      this.index++;

      if (this.index >= this.quizList.length) {
          return;
      }

      this.answer = '';
      this.feedback = '';
      this.answerLocked = false;

      this.nextButtonColor = '#4CAF50';

      setTimeout(() => {

          this.answerInput.nativeElement.focus();

      }, 50);
    }
    else{
      this.endofquiz = true;
    }
  }

  updateProgressBar(type: string) {
    const pos =
      this.correct + this.partial + this.wrong - 1;

    if (pos >= 0 && pos < 15) {
      this.progressCells[pos] = type;
    }
  }

  focusInput() {
    setTimeout(() => {
      this.answerInput?.nativeElement.focus();
    }, 100);
  }

onFileSelected(event: Event) {

  const input = event.target as HTMLInputElement;

  if (!input.files?.length) {
    return;
  }

  const file = input.files[0];

  const reader = new FileReader();

  reader.onload = () => {

    const content = reader.result as string;

    const lines = content
      .split(/\r?\n/)
      .filter(line => line.trim() !== '');

    const firstLine =
      this.parseCsvLine(lines[0]);

    const firstColumn =
      (firstLine[0] ?? '')
        .trim()
        .toLowerCase();

    this.isTopicMode =
      firstColumn === 'thema';

    // vorhandene Vokabeln löschen
    this.vocab = [];

    if (this.isTopicMode) {
      //console.log('Themenmodus erkannt');
      // Hier kommt später die Themenlogik hinein

      for (let i = 1; i < lines.length; i++) {

        const fields =
          this.parseCsvLine(lines[i]);

        const english =
          fields[2]?.trim() ?? '';

        const german =
            fields[1]?.trim() ?? '';

        const field_value =
          fields[0]?.trim() ?? '';

        const alternatives =
          (fields[3] ?? '')
            .split('|')
            .map(x => x.trim())
            .filter(x => x !== '');

        const englishAnswers = [
          english,
          ...alternatives
        ];

        this.vocab.push({
          en: englishAnswers,
          de: german,
          topic: field_value,
          isNew: false
        });

      }

      //console.log(this.vocab);
      
    }
    else{
      //console.log('Bisheriger Vokabelmodus erkannt');
      // Erste Zeile überspringen
      for (let i = 1; i < lines.length; i++) {

        const fields =
          this.parseCsvLine(lines[i]);

        const english =
          fields[0]?.trim() ?? '';

        const german =
          fields[1]?.trim() ?? '';

        const alternatives =
          (fields[2] ?? '')
            .split('|')
            .map(x => x.trim())
            .filter(x => x !== '');


        const englishAnswers = [
          english,
          ...alternatives
        ];

        const isNew =
          (fields[3] ?? '').trim() !== '';

        this.vocab.push({
          en: englishAnswers,
          de: german,
          isNew
        });


      }
  }
    
    this.startQuiz();
    this.cdr.detectChanges();

  };

  reader.readAsText(file, 'iso-8859-1');

}

  parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      }
      else if (char === ';' && !inQuotes) {
        result.push(current);
        current = '';
      }
      else {
        current += char;
      }
    }

    result.push(current);

    return result;
  }

  getTopicOrder(): string[] {

    const topics: string[] = [];

    for (const vocabEntry of this.vocab) {

      const topic =
        vocabEntry.topic ?? '';

      if (
        topic !== '' &&
        !topics.includes(topic)
      ) {
        topics.push(topic);
      }
    }

    const startIndex =
      Math.floor(
        Math.random() * topics.length
      );

    const topicOrder: string[] = [];

    for (let i = 0; i < topics.length; i++) {

      const topicIndex =
        (startIndex + i) %
        topics.length;

      topicOrder.push(
        topics[topicIndex]
      );
    }

    //console.log(topicOrder);
    return topicOrder;
    
  }

}