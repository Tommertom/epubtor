import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';


import { HttpClient } from '@angular/common/http';

interface ePubLine {
  sourceTxt: string;
  destText: string;
  showTranslation: boolean;
}

@Component({
  selector: 'page-contact',
  templateUrl: 'contact.html'
})
export class ContactPage {
  storyLines: Array<ePubLine> = [];
  rawLines: Array<string> = [];
  lastScrollLine = 0;

  constructor(public navCtrl: NavController, private http: HttpClient) {
    this.http.get('assets/txtbooks/El Hobbit - J  R  R  Tolkien.txt', { responseType: 'text' })
      .subscribe((data) => {
        this.storyLines = [];
        this.rawLines = [];
        let loadedLines = data.split("\n");
        loadedLines.map(line => {
          if (line.length > 1)
            this.rawLines.push(line);
        })
        this.loadNextLines();
      });
  }

  loadNextLines() {

    //lastScrollLine
    let numberToLoad = 50;

    console.log('loading', this.lastScrollLine);

    if (this.lastScrollLine < this.rawLines.length)
      while (numberToLoad > 0) {
        if (this.lastScrollLine < this.rawLines.length)
          this.storyLines.push({
            sourceTxt: this.rawLines[this.lastScrollLine],
            destText: '',
            showTranslation: false
          });

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

        console.log('search', url);

        this.http.get(url)
          .subscribe(data => {

            let sentences = data[0];
            let finalTxt = "";
            sentences.map(sentence => {
              finalTxt += sentence[0]
            })

            console.log('DATAATATA', data[0], data[0][0][0])
            item.destText = finalTxt;//data[0][0][0];
          })
      }
    }

  }

}
