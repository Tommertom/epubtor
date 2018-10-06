import { Component } from '@angular/core';
import { Events, NavController, AlertController, ActionSheetController, ToastController } from 'ionic-angular';
import { Storage } from '@ionic/storage';
import { BookTranslator, Book } from '../../providers/booktranslater.provider';


@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  viewLines: Array<Object> = [];
  book: Book;
  lastScrollLine = 0;
  transCount = 0;
  debug: string = "";
  viewMode: number = 0;
  lastClicked: number = 0;
  lastToast;

  constructor(
    private toastCtrl: ToastController,
    public events: Events,
    private bookTranslatorService: BookTranslator,
    private actionsheetCtrl: ActionSheetController,
    private storage: Storage, public navCtrl: NavController,
    public alerCtrl: AlertController) {
    events.subscribe('translation:gotten', ((index) => {
      console.log(' deded', index)
      // user and time are the same arguments passed in `events.publish(user, time)`
      this.transCount = index['index'];
    }))
  }

  addDebug(msg) {
    this.debug = this.debug + ' | ' + JSON.stringify(msg, null, 2)
  }

  ionViewWillLeave() {
    if (this.book)
      this.bookTranslatorService.saveBook(this.book)
  }

  ionViewDidEnter() {


    this.addDebug(this.storage.driver);
    this.storage.keys().then(val => {
      console.log('keys ', val)
      //   this.addDebug(val)
    })


    this.storage.get('viewMode')
      .then(val => {
        if (val) this.viewMode = val
        else this.viewMode = 0;
      })


    this.storage.forEach((value, key, num) => {
      this.addDebug({ key: key, value: JSON.stringify(value).length, index: num })
    })

    // lets load the preloaded onces
    let preloaded = [
      // { key: 'book-altamirano', url: 'assets/txtbooks/ignacio-manuel-altamirano-la-navidad-en-las-monta-as.txt' },
      // { key: 'book-la_hucha', url: 'assets/txtbooks/la_hucha.txt' },
      //  { key: 'book-la_piedra_filosofal', url: 'assets/txtbooks/la_piedra_filosofal.txt' },
      { key: 'book-thebigshort', url: 'assets/txtbooks/The Big Short 2015.srt' },
      { key: 'book-dune', url: 'assets/txtbooks/Dune - Frank Herbert.txt' },
      { key: 'book-secuestro', url: 'assets/txtbooks/El Secuestro - John Grisham.txt' },
      { key: 'book-brujas', url: 'assets/txtbooks/Las Brujas - Roald Dahl.txt' },
      { key: 'book-mathilda', url: 'assets/txtbooks/Matilda - Roald Dahl.txt' },
      //   { key: 'book-nottinghill', url: 'assets/txtbooks/Notting Hill.srt' },
      //  { key: 'book-montypython', url: 'assets/txtbooks/Monty.Python.And.The.Holy.Grail.1975.srt' },
      { key: 'book-hobbitsrt', url: 'assets/txtbooks/the-hobbit-an-unexpected-journey-yify-spanish.srt' },
      { key: 'book-pinochio', url: 'assets/txtbooks/las_aventuras_de_pinocho.txt' },
      { key: 'book-universoparalelo', url: 'assets/txtbooks/universoparalelo.txt' },
      { key: 'book-thehobbit', url: 'assets/txtbooks/El Hobbit - J  R  R  Tolkien.txt' }
    ]
    let booklist = [];
    this.bookTranslatorService.getBooklist()
      .then(val => {
        console.log('booklist', val)
        if (val) booklist = val
        else booklist = [];

        preloaded.map(bookurl => {
          console.log('checking ', bookurl, bookurl.key.replace('book-', ''))
          if (booklist.indexOf(bookurl.key) < 0) {
            this.addDebug(' adding ' + bookurl.key)
            this.bookTranslatorService.getTxtBookFromURL(bookurl.url, bookurl.key.replace('book-', ''))
          }
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
      .then((book: Book) => {
        this.viewLines = [];
        this.lastScrollLine = 0;
        this.book = book;
        this.transCount = 0;
        this.loadNextLines();

        let lc = 0;
        let tc = 0;
        if (this.book)
          this.book.booklines.map(line => {
            if (line.destLine.length > 0) tc += 1;
            lc += 1;
          })

        this.addDebug({ tc: tc, lc: lc })
        console.log('Loaded book', this.book, tc, lc)

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
          text: 'Translate this book fully',
          //  icon: !this.platform.is('ios') ? 'share' : null,
          handler: () => {
            this.bookTranslatorService.translateBook(this.book, 0);
            // console.log('Share clicked');
          }
        },
        {
          text: 'Toggle view mode',
          //  role: 'destructive',
          //  icon: !this.platform.is('ios') ? 'trash' : null,
          handler: () => {
            this.viewMode = this.viewMode += 1;
            if (this.viewMode > 1) this.viewMode = 0;
            this.storage.set('viewMode', this.viewMode)

            //console.log('Lastclicked ', this.lastClicked)
            setTimeout(() => {
              document.getElementById('' + this.lastClicked).scrollIntoView({ behavior: "smooth" });
            }, 500);
          }
        },
        {
          text: 'Delete all loaded books',
          role: 'destructive',
          //  icon: !this.platform.is('ios') ? 'trash' : null,
          handler: () => {
            this.bookTranslatorService.deleteBooks();
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

  loadNextLines() {
    let numberToLoad = 550;

    if (this.book)
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

  toastTranslation(line, i) {
    console.log('TOAST', this.lastToast);

    if (this.lastToast) this.lastToast.dismissAll();
    this.lastToast = this.toastCtrl.create({
      message: line,
      duration: 8000,
      position: 'bottom',
      showCloseButton: true
    });

    this.lastClicked = i;
    this.storage.set('lastClicked' + this.book.title, i);
    this.lastToast.present();
  }

  selectLine(item, i) {

    if (item.bookLine.sourceLine.length > 0) {

      this.lastClicked = i;
      this.storage.set('lastClicked' + this.book.title, this.lastClicked);

      //  console.log('toggle', item, i);
      item.showTranslation = !item.showTranslation;

      if (this.viewLines[i]['bookLine']['destLine'] == '') {
        this.bookTranslatorService.getTranslation(this.book, i)
          .then((val) => {
            //console.log('STUFF received', val)
            if (val)
              if (val['sentences']) this.viewLines[i]['bookLine'] = val;
          })
      }
    }

    setTimeout(() => {
      if (!item.showTranslation)
        document.getElementById(i).scrollIntoView({ behavior: "smooth" });
    }, 500);
  }

}

