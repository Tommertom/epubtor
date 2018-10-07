import { Component } from '@angular/core';
import { Events, NavController, AlertController, ActionSheetController, ToastController } from 'ionic-angular';
import { Storage } from '@ionic/storage';
import { BookTranslator, Book } from '../../providers/booktranslater.provider';

@Component({
  selector: 'page-active',
  templateUrl: 'active.html'
})
export class ActivePage {

  viewLines: Array<Object> = [];
  book: Book;
  lastScrollLine = 0;
  debug: string = "";
  lastToast;
  linesAndQuestions = [];
  itemIndex = 0;
  questionShown:boolean=false;

  constructor(
    private toastCtrl: ToastController,
    public events: Events,
    private bookTranslatorService: BookTranslator,
    private actionsheetCtrl: ActionSheetController,
    private storage: Storage, public navCtrl: NavController,
    public alerCtrl: AlertController) {
  }

  addDebug(msg) {
    this.debug = this.debug + ' | ' + JSON.stringify(msg, null, 2)
  }

  ionViewWillLeave() {
    if (this.book)
      this.bookTranslatorService.saveBook(this.book)
  }

  ionViewDidEnter() {

    let booklist = [];
    this.bookTranslatorService.getBooklist()
      .then(val => {
        console.log('booklist', val)
        if (val) booklist = val
        else booklist = [];

        this.storage.get('lastRead')
          .then(val => {
            if (val) this.loadAndViewBook(val)
            else this.openBookSelector();
          })

      })
  }

  loadAndViewBook(data) {
    this.bookTranslatorService.getBook(data)
      .then((book: Book) => {
        this.viewLines = [];
        this.lastScrollLine = 0;
        this.book = book;

        this.book.booklines.map(line => {
          line.sentences.map(sentence => {
            this.linesAndQuestions.push({ line: sentence.sentenceSource, translation: sentence.sentenceDest, question: '' });
          })
        })

        console.log('ADSDADSA', this.linesAndQuestions);

        if (this.book)
          this.storage.get('lastClicked' + this.book.title)
            .then(val => {
              if (val)
                setTimeout(() => {
                  let b = document.getElementById(val);
                  if (b) b.scrollIntoView({ behavior: "instant" })
                }, 500);
            })

        if (this.book)
          this.storage.set('lastRead', this.book.storeKey);
      })
  }

  nextItem() {
    this.itemIndex += 1;
  }

  askQuestion() {
    this.questionShown=!this.questionShown;
  }

  openBookSelector() {

    let alert = this.alerCtrl.create();
    alert.setTitle('Select book to read');

    this.bookTranslatorService.getBooklist()
      .then(booklist => {
        if (booklist) {
          booklist.map(book => {

            //  console.log('BOOK', book);
            alert.addInput({
              type: 'radio',
              label: book,
              value: book
            });
          })
        }

        alert.addButton('Cancel');

        alert.addButton({
          text: 'Ok',
          handler: data => {
            //console.log('Radio data:', data);
            if (data)
              this.loadAndViewBook(data);

          }
        });
        alert.present();
      })
  }


  openBookActions() {
    let actionSheet = this.actionsheetCtrl.create({
      title: 'Book actions',
      // cssClass: 'action-sheets-basic-page',
      buttons: [
        {
          text: 'Open loaded books',
          //  role: 'destructive',
          //  icon: !this.platform.is('ios') ? 'trash' : null,
          handler: () => {
            this.openBookSelector();
          }
        },
        {
          text: 'Cancel',
          role: 'cancel', // will always sort to be on the bottom
          //  icon: 'close',
          handler: () => {
            console.log('Cancel clicked');
          }
        }
      ]
    });
    actionSheet.present();
  }

  toastTranslation(line, i) {
    //   console.log('TOAST', this.lastToast);

    if (this.lastToast) this.lastToast.dismissAll();
    this.lastToast = this.toastCtrl.create({
      message: line,
      duration: 8000,
      position: 'bottom',
      showCloseButton: true
    });

    this.lastToast.present();
  }

  
}

