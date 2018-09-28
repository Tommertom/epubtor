import { Component } from '@angular/core';
import { NavController, AlertController } from 'ionic-angular';

import { Storage } from '@ionic/storage';
import { BookTranslator,  Book } from '../../providers/booktranslater.provider';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  viewLines: Array<Object> = [];
  book: Book;
  lastScrollLine = 0;

  constructor(
    private bookTranslatorService: BookTranslator,
    private storage: Storage, public navCtrl: NavController,
    public alerCtrl: AlertController) { }

  ionViewDidEnter() {

    // lets load the preloaded onces
    let preloaded = [
      { key: 'book-altamirano', url: 'assets/txtbooks/ignacio-manuel-altamirano-la-navidad-en-las-monta-as.txt' },
      { key: 'book-la_hucha', url: 'assets/txtbooks/la_hucha.txt' },
      { key: 'book-la_piedra_filosofal', url: 'assets/txtbooks/la_piedra_filosofal.txt' },
      { key: 'book-pinochio', url: 'assets/txtbooks/las_aventuras_de_pinocho.txt' },
      { key: 'book-thehobbit', url: 'assets/txtbooks/El Hobbit - J  R  R  Tolkien.txt' }
    ]
    let booklist;
    this.bookTranslatorService.getBooklist()
      .then(val => {
        console.log('booklist', val)
        if (val) booklist = val
        else booklist = [];

        preloaded.map(bookurl => {
          console.log('checking ', bookurl, bookurl.key.replace('book-', ''))
          if (booklist.indexOf(bookurl.key) < 0)
            this.bookTranslatorService.getTxtBookFromURL(bookurl.url, bookurl.key.replace('book-', ''))
        })

        this.storage.get('lastRead')
          .then(val => {
            if (val) this.loadAndViewBook(val)
            else this.openBookSelector();
          })

      })
  }

  loadAndViewBook(data) {
    this.bookTranslatorService.getBook(data)
      .then(book => {
        this.viewLines = [];
        this.lastScrollLine = 0;
        this.book = book;
        this.loadNextLines();

        this.storage.get('lastClicked' + this.book.title)
          .then(val => {
            if (val)
              setTimeout(() => {
                let b = document.getElementById(val);
                if (b) b.scrollIntoView({ behavior: "instant" })
              }, 500);
          })

        this.storage.set('lastRead', this.book.storeKey);
      })
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


  loadNextLines() {
    let numberToLoad = 550;

    if (this.lastScrollLine < this.book.booklines.length)
      while (numberToLoad > 0) {
        if (this.lastScrollLine < this.book.booklines.length) {
       //   let lineSource = this.viewLines[this.lastScrollLine];

          this.viewLines.push({
            bookLine: this.book.booklines[this.lastScrollLine],
            showTranslation: false
          });

        }

        this.lastScrollLine += 1;
        numberToLoad -= 1;
      }
  }

  doInfinite(infiniteScroll) {
    this.loadNextLines();

    setTimeout(() => {
      infiniteScroll.complete();
    }, 250);
  }

  selectLine(item, i) {

    if (item.bookLine.sourceLine.length > 0) {

      this.storage.set('lastClicked' + this.book.title, i);

      //  console.log('toggle', item, i);
      item.showTranslation = !item.showTranslation;

      if (this.viewLines[i]['bookLine']['destLine'] == '') {
        this.bookTranslatorService.getTranslation(this.book, i)
          .then((val) => {
            //            console.log('STUFF received', val, val['sentences'].length)
            this.viewLines[i]['bookLine'] = val;
          })
      }
    }

    setTimeout(() => {
      if (!item.showTranslation)
        document.getElementById(i).scrollIntoView({ behavior: "smooth" });
    }, 500);
  }

}

