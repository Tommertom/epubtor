import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Storage } from '@ionic/storage';

import { tap, filter, map } from 'rxjs/operators';

/*
{
  providedIn: 'root',
}
*/

export interface Book {
    title: string;
    booklines: Array<LineTranslation>;
}

export interface BookList {
    book: Book;
    storeKey: string;
}

export interface TranslationSentences {
    sentenceSource: string;
    sentenceDest: string;
}

export interface LineTranslation {
    sourceLine: string;
    destLine: string;
    sentences: Array<TranslationSentences>;
}

@Injectable()
export class BookTranslator {

    books: Array<Book> = [];
    booklist: Array<BookList> = [];

    constructor(private storage: Storage, private http: HttpClient) { }

    //'assets/txtbooks/las_aventuras_de_pinocho.txt'
    getTxtBookFromURL(url: string, title: string) {
        this.http.get(url, { responseType: 'text' })
            .subscribe((data) => {

                // lets parse all the lines
                let bookLines = [];
                let loadedLines = data.split("\n");
                loadedLines.map(line => {
                    if (line.length > 1)
                        bookLines.push({
                            sourceLine: line,
                            destLine: "",
                            sentences: []
                        });
                })

                let book = {
                    title: title,
                    booklines: bookLines
                }

                let storeKey = 'book-' + title;
                this.booklist.push({
                    book: book,
                    storeKey: storeKey
                })

                //and put the book in storage
                this.storage.set(storeKey, book);

                console.log('Book loaded ',book);
            })
    }

    translateLine<LineTranslation>(sourceLang, targetLang, sourceText) {
        sourceLang = "es";
        targetLang = "en";

        let url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl="
            + sourceLang + "&tl=" + targetLang + "&dt=t&q=" + encodeURI(sourceText);

        return this.http.get(url)
            .pipe(
                tap(data => { }),
                map(data => {

                    //let sentences = data[0];
                    let sourceLine = sourceText;
                    let destLine = "";
                    let sentences = [];

                    // lets parse the sentences returned from the API
                    data[0].map(sentence => {
                        destLine += sentence[0] + "\n";
                        sentences.push({
                            sentenceSource: sentence[1],
                            sentenceDest: sentence[0],
                        })
                    })

                    return {
                        sourceLine: sourceLine,
                        destLine: destLine,
                        sentences: sentences
                    };
                }))
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
