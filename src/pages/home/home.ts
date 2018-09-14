import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';

import { HttpClient } from '@angular/common/http';

interface ePubLine {
  sourceTxt: string;
  destText: string;
  showTranslation: boolean;
}

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  storyLines: Array<ePubLine> = [];

  constructor(public navCtrl: NavController, private http: HttpClient) {
    this.http.get('assets/txtbooks/las_aventuras_de_pinocho.txt', { responseType: 'text' })
      .subscribe((data) => {
        this.storyLines = [];
        let rawLines = data.split("\n");
        rawLines.map(line => {
          this.storyLines.push({
            sourceTxt: line,
            destText: '',
            showTranslation: false
          })
        })
      });
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
            console.log('DATAATATA', data[0][0][0])
            item.destText = data[0][0][0];
          })
      }
    }

  }

}
