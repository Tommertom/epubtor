import { Book } from './booktranslater.provider';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Storage } from '@ionic/storage';

import { tap, map } from 'rxjs/operators';

/*
{
  providedIn: 'root',
}
https://www.e-stories.org/read-stories.php?sto=14537
*/


export interface Book {
    title: string;
    booklines: Array<BookLine>;
    storeKey: string;
}

export interface BookLine {
    sourceLine: string;
    destLine: string;
    sentences: Array<TranslationSentences>;
    index: number;
}

export interface TranslationSentences {
    sentenceSource: string;
    sentenceDest: string;
}

@Injectable()
export class BookTranslator {

    booklist: Array<string> = [];

    constructor(private storage: Storage, private http: HttpClient) { }


    //'assets/txtbooks/las_aventuras_de_pinocho.txt'
    getTxtBookFromURL(url: string, title: string) {

        return this.http.get(url, { responseType: 'text' })
            .toPromise()
            .then((data) => {
                // lets parse all the lines
                let bookLines = [];
                let linecount = 0;
                let loadedLines = data.split("\n");

                let pushLine: string = "";

                loadedLines.map(line => {

                    line = line.trim();
                    let loadLine: boolean = true;
                    line = line.replace('<i>', '')
                    line = line.replace('</i>', '')
                    line = line.replace('...', '')

                    if (line.length == 0) loadLine = false;
                    let isnum = /^\d+$/.test(line);
                    if (isnum) loadLine = false;

                    if (line.includes('-->')) loadLine = false;


                    if (loadLine) {

                        pushLine += line + ' ';

                        if (pushLine.length > 1000) {
                            bookLines.push({
                                sourceLine: pushLine,
                                destLine: "",
                                sentences: [],
                                index: linecount
                            });
                            linecount += 1;
                            pushLine = "";
                        }
                    }
                })

                //                linecount += 1;
                bookLines.push({
                    sourceLine: pushLine,
                    destLine: "",
                    sentences: [],
                    index: linecount
                });
                pushLine = "";


                let storeKey = 'book-' + title;
                let book = {
                    title: title,
                    booklines: bookLines,
                    storeKey: storeKey
                }

                // and put the book in storage
                // side effect
                this.storage.set(storeKey, book);
                console.log('Book loaded from URL', book);

                this.storage.get('booklist')
                    .then(val => {
                        if (val) this.booklist = val
                        else this.booklist = [];
                        this.booklist.push(storeKey);
                        this.storage.set('booklist', this.booklist)
                    })


                return Promise.resolve(book);
            })
    }

    getBooklist() {
        return this.storage.ready()
            .then(() => { return this.storage.get('booklist') })
    }

    getBook<Book>(bookKey: string) {
        return this.storage.ready()
            .then(() => { return this.storage.get(bookKey) })
    }
    
  
    deleteBooks() {
        this.getBooklist()
            .then(books => {
                books.map(bookKey => {
                    this.storage.remove(bookKey);
                    console.log('Deleteing', bookKey)
                })
                this.storage.set('booklist', [])
            })
    }

    getTranslation(book: Book, index: number) {
        let res;
        if (book.booklines[index].destLine == "")
            res = this.getGoogleTranslation('es', 'en', book.booklines[index].sourceLine)
                .toPromise()
                .then(val => {
                    book.booklines[index].sourceLine = val.sourceLine;
                    book.booklines[index].destLine = val.destLine;
                    book.booklines[index].sentences = val.sentences;

                    //   console.log('Translated and saved', book.booklines[index]);

                    this.storage.set(book.storeKey, book);

                    return Promise.resolve(book.booklines[index]);
                })
        else res = Promise.resolve(book.booklines[index]);

        return res;
    }

    getGoogleTranslation(sourceLang, targetLang, sourceText) {
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


    GOOGLE DOES NOT LIKE THIS
       translateBook(book: Book, index: number) {
   
           console.log('calling trsn', index);
   
           if (index == book.booklines.length) return Promise.resolve(true)
           else {
               if (book.booklines[index].destLine != "") return this.translateBook(book, index + 1)
               else {
                   return this.getGoogleTranslation('es', 'en', book.booklines[index].sourceLine)
                       .toPromise()
                       .then(val => {
                           book.booklines[index].destLine = val.destLine;
                           book.booklines[index].sentences = val.sentences;
                           console.log('Value received ', val, book.booklines[index]);
                           return this.translateBook(book, index + 1);
                       })
   
               }
           }
       }
   */
