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
  vocab: Vocabulary[] = [
    {en:"at", de:"in; an; um; bei; auf"},
    {en:"Good morning.", de:"Guten Morgen."},
    {en:"boy", de:"der Junge"},
    {en:"girl", de:"das Mädchen"},
    {en:"to look at", de:"anschauen"},
    {en:"board", de:"Die Tafel"},
    {en:"Can you help me?", de:"Können Sie mir helfen?; Kannst du mir helfen?"},
    {en:"yes", de:"ja"},
    {en:"of course", de:"natürlich; selbstverständlich"},
    {en:"to sit down", de:"sich hinsetzen"},
    {en:"to be", de:"sein"},
    {en:"quiet", de:"ruhig; leise; still"},
    {en:"to listen (to)", de:"zuhören; anhören; hören"},
    {en:"Don't talk.", de:"Sei(d) still.; Rede(t) nicht."},
    {en:"Sorry.", de:"Tut mir leid.; Entschuldigung."},
    {en:"here", de:"hier"},
    {en:"book", de:"das Buch; das Heft"},
    {en:"Excuse me!", de:"Entschuldigung!"},
    {en:"to have", de:"haben"},
    {en:"an", de:"ein/eine"},
    {en:"pen", de:"der Füller; der Stift"},
    {en:"Here you are.", de:"Bitte schön."},
    {en:"bag", de:"die Tasche; die Tüte"},
    {en:"folder", de:"der Ordner; die Mappe"},
    {en:"exercise book", de:"das Übungsheft"},
    {en:"phone", de:"das Handy; das Telefon"},
    {en:"tablet", de:"das Tablet"},
    {en:"pencil", de:"der Bleistift; der Buntstift"},
    {en:"pair of scissors", de:"die Schere"},
    {en:"sharpener", de:"der Spitzer"},
    {en:"rubber", de:"der Radiergummi"},
    {en:"ruler", de:"das Lineal"},
    {en:"pencil case", de:"das Federmäppchen"},
    {en:"there are", de:"das sind; es gibt"},
    {en:"for", de:"für"},
    {en:"no", de:"nein; kein/keine"},
    {en:"to close", de:"schließen; zumachen"},
    {en:"to open", de:"öffnen; aufmachen"},
    {en:"again", de:"noch einmal; wieder"},
    {en:"to write", de:"schreiben"},
    {en:"on", de:"auf; an"},
    {en:"to take out", de:"herausnehmen; herausbringen"},
    {en:"rule", de:"die Regel"},
    {en:"classroom", de:"das Klassenzimmer"},
    {en:"playground", de:"der Schulhof; der Pausenhof; der Spielplatz"},
    {en:"cafeteria", de:"die Cafeteria; die Mensa"},
    {en:"toilet", de:"die Toilette"},
    {en:"library", de:"die Bibliothek; die Bücherei"},
    {en:"gym", de:"die Turnhalle; das Fitnessstudio"},
    {en:"office", de:"das Büro"}
    // Rest der Liste hier einfügen
  ];

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

    setTimeout(() => {

        this.startQuiz();

    }, 50);

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
      .replace(/[´`‘’‚‛‹›ʻʼʹ]/g, "'");
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

}