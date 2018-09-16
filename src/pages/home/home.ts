import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';

import { HttpClient } from '@angular/common/http';
import { Storage } from '@ionic/storage';

interface TranslationCouple {
  sentenceSource: string;
  sentenceDest: string;
}

interface ePubLine {
  sourceTxt: string;
  destText: string;
  translation: Array<TranslationCouple>;
  sentencesSource: Array<string>;
  sentencesDest: Array<string>;
  showTranslation: boolean;
}

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  storyLines: Array<ePubLine> = [];
  rawLines: Array<string> = [];
  lastScrollLine = 0;

  constructor(private storage: Storage, public navCtrl: NavController, private http: HttpClient) {

    this.storage.ready()
      .then(() => {
        return this.storage.get('pino')
      })
      .then(val => {
        if (val != null) {
          this.rawLines = val;
          this.loadNextLines();
        }
        else this.http.get('assets/txtbooks/las_aventuras_de_pinocho.txt', { responseType: 'text' })
          .subscribe((data) => {
            this.storyLines = [];
            this.rawLines = [];
            let loadedLines = data.split("\n");
            loadedLines.map(line => {
              if (line.length > 1)
                this.rawLines.push(line);
            })

            this.storage.set('pino', this.rawLines);
            this.loadNextLines();
          })
      });


    this.http.get('assets/txtbooks/jehle_verb_database.csv', { responseType: 'text' })
      .subscribe((data) => {
        // this.storyLines = [];
        // this.rawLines = [];
        let loadedLines = data.split("\n");
        let verbList = [];
        loadedLines.map(line => {

          verbList.push(line.split('"').filter(item => item != ','))
          
          //  if (line.length > 1)
          //    this.rawLines.push(line);
        })
        console.log('SPLIT', verbList );

        //  this.storage.set('pino', this.rawLines);
        // this.loadNextLines();
      })
  }

  loadNextLines() {

    //lastScrollLine
    let numberToLoad = 50;

    console.log('loading', this.lastScrollLine);

    if (this.lastScrollLine < this.rawLines.length)
      while (numberToLoad > 0) {
        if (this.lastScrollLine < this.rawLines.length) {
          let lineSource = this.rawLines[this.lastScrollLine];

          this.storyLines.push({
            sourceTxt: lineSource,
            destText: '',
            sentencesSource: [lineSource],
            sentencesDest: [],
            translation: [],
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
    }, 500);
  }

  lineSelected(item) {

    if (item.sourceTxt.length > 0) {

      console.log('toggle', item);
      item.showTranslation = !item.showTranslation;

      if (item.destText.length == 0) {
        let sourceLang = "es";
        let targetLang = "en";
        let sourceText = item.sourceTxt;

        let url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl="
          + sourceLang + "&tl=" + targetLang + "&dt=t&q=" + encodeURI(sourceText);

        //console.log('search', url);

        this.http.get(url)
          .subscribe(data => {

            let sentences = data[0];
            item.destText = "";
            item.sentencesSource = [];
            item.sentencesDest = [];

            sentences.map(sentence => {
              item.destText += sentence[0] + "\n";
              item.translation.push({
                sentenceSource: sentence[1],
                sentenceDest: sentence[0],
              })

              item.sentencesSource.push(sentence[1]);
              item.sentencesDest.push(sentence[0]);
            })

            console.log('DATAATATA', data[0], data[0][0][0])

            console.log('FILLED ITEM', item);

          })
      }
    }

  }

}

  /*
var url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=" 
          + sourceLang + "&tl=" + targetLang + "&dt=t&q=" + encodeURI(sourceText);
 
var result = JSON.parse(UrlFetchApp.fetch(url).getContentText());
 
translatedText = result[0][0][0];
 
var json = {
  'sourceText' : sourceText,
  'translatedText' : translatedText
};

https://ctrlq.org/code/19909-google-translate-api

https://github.com/matheuss/google-translate-api
*/
