import { Storage } from '@ionic/storage';
import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';

@Component({
  selector: 'page-about',
  templateUrl: 'about.html'
})
export class AboutPage {

  verbTree = {};
  question: string = "";
  word: string = "";
  answers: Array<Object> = [{ text: 'HI' }, { text: 'HI2' }, { text: 'HI' }, { text: 'HI2' }];
  mode: string = "ES-EN";
  history: Object = {};
  maxwordcount: number = 0;
  words: Array<string> = [];
  wrongwords: Array<string> = [];

  constructor(private storage: Storage, public navCtrl: NavController, private http: HttpClient) {
    this.loadVerbs();

    this.storage.get('configQuiz')
      .then(val => {
        if (val) {
          this.mode = val.mode;
          this.history = val.history;
          this.wrongwords = val.wrongwords;
        }
        //this.nextQuestion();
      })
  }

  answerSelected(answer) {
    if (this.verbTree[this.word]['translation'] == answer.text)
      this.nextQuestion()
    else {
      this.wrongwords.push(this.word);
      answer.text = '! ' + answer.text;
     // console.log('WRONGWORDS', this.wrongwords)
    }

    this.storage.set('configQuiz', {
      mode: this.mode,
      history: this.history,
      wrongwords: this.wrongwords
    })
  }

  nextQuestion() {

    // push it in the history
    if (typeof this.history['mode'] == 'undefined')
      this.history['mode'] = [];
    this.history['mode'].push(this.word);


   // console.log('SADSAD', this.question, this.answers, this.word, this.mode)
    // lets find a new word
    let item = Math.floor(Math.random() * this.maxwordcount);
    this.word = this.words[item];

    // empty the answers
    for (let i = 0; i < this.answers.length; i++) {
      this.answers[i]['text'] == '';
    }

    // and lets fill it
    let aposition = Math.floor(Math.random() * 4);
    if (this.mode == 'ES-EN') {
      this.question = this.word;
      this.answers[aposition] = { text: this.verbTree[this.word]['translation'] }

      // fill the rest of the answers with descriptions
      for (let i = 0; i < this.answers.length; i++) {
        let randomitem = Math.floor(Math.random() * this.maxwordcount);
        let randomword = this.words[randomitem];
        if (i != aposition) this.answers[i] = { text: this.verbTree[randomword]['translation'] }; //
      }
    }
    else {
      this.question = this.verbTree[this.word]['translation']
      this.answers[aposition] = this.word;

      // fill the rest of the answers with descriptions
      for (let i = 0; i < this.answers.length; i++) {
        let randomitem = Math.floor(Math.random() * this.maxwordcount);
        let randomword = this.words[randomitem];
        if (i != aposition) this.answers[i] = { text: randomword }; //
      }
    }

    // console.log('Question nd stuff', this.answers, this.word, this.question, this.verbTree[this.word]['translation']);
  }

  swapMode() {
    if (this.mode == 'ES-EN') this.mode = 'EN-ES'
    else this.mode = 'ES-EN'
    this.nextQuestion();
  }

  loadVerbs() {
    this.http.get('assets/dict/jehle_verb_database.csv', { responseType: 'text' })
      .subscribe((data) => {
        let loadedLines = data.split("\n");
        let verbList = [];
        loadedLines.map(line => {
          verbList.push(
            line.split('"').filter(item => (item != ',') && (item.length > 1)))
        })

        this.verbTree = {}
        verbList.map(verbMeta => {

          let verb = verbMeta[0];
          let infinitivetranslation = verbMeta[1];
          let mood = verbMeta[2];
          let tense = verbMeta[5];
          let verbtranslation = verbMeta[6];
          let conjug = verbMeta.slice(7, 13);
          let gerund = verbMeta[13];
          let gerundtranslation = verbMeta[14];
          let pastparticiple = verbMeta[15];
          let pastparticipletranslation = verbMeta[16];

          // create a new item if the verb does not exist
          if (typeof this.verbTree[verb] == 'undefined')
            this.verbTree[verb] = {
              translation: infinitivetranslation,
              moods: {},
              gerund: { gerund: gerund, gerundtranslation: gerundtranslation },
              pastparticiple: { pastparticiple: pastparticiple, pastparticipletranslation: pastparticipletranslation }
            }
          // create the insertion point for the tense
          if (typeof this.verbTree[verb]['moods'][mood] == 'undefined')
            this.verbTree[verb]['moods'][mood] = {};

          // add the leaf
          this.verbTree[verb]['moods'][mood][tense] = {
            conjugation: conjug,
            translation: verbtranslation
          }
        })

        // console.log('VERBTREE', this.verbTree);
        this.words = Object.keys(this.verbTree);
        this.maxwordcount = this.words.length;
        //this.verbList = Object.keys(verbTree);
      })
  }

}
