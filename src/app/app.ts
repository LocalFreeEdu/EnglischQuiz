import { Component, HostListener, ViewChild, ElementRef, OnInit, ChangeDetectorRef,} from '@angular/core';
import { FormsModule } from '@angular/forms';



interface Vocabulary {
  en: string;
  de: string;
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

    /*console.log('Taste:', event.key);*/

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

  answer = '';

  correct = 0;
  partial = 0;
  wrong = 0;

  answerLocked = false;
  feedback = '';

  constructor(private cdr: ChangeDetectorRef) {
    /*this.startQuiz();*/
    
  }

 ngOnInit(): void {

//Nichts zu tun

}

startQuiz() {

  this.endofquiz = false;
  //console.log('startQuiz BEGIN');

    this.quizList = [];

    this.progressCells = Array(15).fill('gray');

    this.quizList = [...this.vocab]
        .sort(() => Math.random() - 0.5)
        .slice(0, 15);

    this.index = 0;
    this.correct = 0;
    this.partial = 0;
    this.wrong = 0;

    this.answer = '';
    this.feedback = '';
    this.answerLocked = false;

    //this.focusInput();
    //console.log('startQuiz ENDE');
//console.log('Laenge', this.quizList.length);
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

      const correctRaw = this.quizList[this.index].en;

      // Exakte Prüfung (Groß-/Kleinschreibung beachten)
      const userExact = this.normalize(this.answer);
      const correctExact = this.normalize(correctRaw);

      // Groß-/Kleinschreibung ignorieren
      const userLower = this.normalizeLower(this.answer);
      const correctLower = this.normalizeLower(correctRaw);

      const noBrackets = this.normalizeLower(
        this.removeBrackets(correctRaw)
      );

      const noPunct = this.normalizeLower(
        this.removePunctuation(correctRaw)
      );

      const noSpaces = this.normalizeLower(
        this.removeSpaces(correctRaw)
      );

      let result = 'wrong';

      // Perfekt
      if (userExact === correctExact) {
        result = 'correct';
      }

      // Nur Groß-/Kleinschreibung falsch
      else if (userLower === correctLower) {
        result = 'partial';
      }

      // Klammern ignoriert
      else if (userLower === noBrackets) {
        result = 'partial';
      }

      // Satzzeichen ignoriert
      else if (userLower === noPunct) {
        result = 'partial';
      }

      // Leerzeichen vergessen/anders gesetzt
      else if (
        this.removeSpaces(userLower) === noSpaces
      ) {
        result = 'partial';
      }

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
            `Teilweise richtig. Richtige Antwort: ${correctRaw}`;
        } else {
          this.wrong++;
          this.updateProgressBar('wrong');
          this.nextButtonColor = '#f44336';
          this.feedback =
            `Falsch. Richtige Antwort: ${correctRaw}`;
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

          /*console.log(
              'Aktives Element:',
              document.activeElement
          );*/

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

    // vorhandene Vokabeln löschen
    this.vocab = [];

    // Erste Zeile überspringen
    for (let i = 1; i < lines.length; i++) {

      const match = lines[i].match(
        /^([^;]+);(.*)$/
      );

      if (!match) {
        continue;
      }

      const english = match[1].trim();

      const german = match[2]
        .trim()
        .replace(/^"/, '')
        .replace(/"$/, '');

      this.vocab.push({
        en: english,
        de: german
      });

    }

    /*console.log(this.vocab);

    console.log("Vokabeln:", this.vocab.length);*/
    
    this.startQuiz();

    /*console.log("Quiz:", this.quizList.length);*/

    this.cdr.detectChanges();

  };

  reader.readAsText(file, 'iso-8859-1');

}

}