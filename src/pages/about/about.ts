import { Storage } from '@ionic/storage';
import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { NavController, AlertController } from 'ionic-angular';

@Component({
  selector: 'page-about',
  templateUrl: 'about.html'
})
export class AboutPage {

  wordsDone = [];
  verbTree = {};
  otherTree = {};
  question: string = ".";
  word: string = "";
  answers: Array<Object> = [{ text: '' }, { text: '' }, { text: '' }, { text: '' }];
  mode: string = "ES-EN";
  history: Object = {};
  maxwordcount: number = 0;
  words: Array<string> = [];
  wrongwords: Array<string> = [];
  goodwords: Array<string> = [];

  constructor(private alerCtrl: AlertController, private storage: Storage, public navCtrl: NavController, private http: HttpClient) {
    this.loadVerbs();
    //this.loadOthers();

    this.storage.get('configQuiz')
      .then(val => {
        if (val) {
          this.mode = val.mode;
          this.history = val.history;
          this.wrongwords = val.wrongwords;
          if (val.goodwords) this.goodwords = val.goodwords;
        }
      })
  }

  answerSelected(answer) {
    if (this.word == answer.word) {
      this.goodwords = [answer.word + ' ' + this.verbTree[answer.word]['translation']].concat(this.goodwords);
    }
    else {
      this.wrongwords = [answer.word + ' ' + this.verbTree[answer.word]['translation']].concat(this.wrongwords);
      this.wrongwords = [this.word + ' ' + this.verbTree[this.word]['translation']].concat(this.wrongwords);
      answer.text = '! ' + answer.word + ' -> ' + this.verbTree[answer.word]['translation']
    }

    this.storage.set('configQuiz', {
      mode: this.mode,
      history: this.history,
      wrongwords: this.wrongwords,
      goodwords: this.goodwords
    })
  }

  nextQuestion() {

    // push it in the history
    if (typeof this.history['mode'] == 'undefined')
      this.history['mode'] = [];
    this.history['mode'].push(this.word);

    this.wordsDone.push(this.word);

    while (this.wordsDone.indexOf(this.word) > -1) {
      let item = Math.floor(Math.random() * this.maxwordcount);
      this.word = this.words[item];
     // console.log('Words done', this.wordsDone, this.word,item);
    }

    // empty the answers
    for (let i = 0; i < this.answers.length; i++) {
      this.answers[i]['text'] == '';
      this.answers[i]['word'] == '';
    }

    // and lets fill it
    let aposition = Math.floor(Math.random() * 4);
    if (this.mode == 'ES-EN') {
      this.question = this.word;
      this.answers[aposition] = { text: this.verbTree[this.word]['translation'], word: this.word }

      // fill the rest of the answers with descriptions
      for (let i = 0; i < this.answers.length; i++) {
        let randomitem = Math.floor(Math.random() * this.maxwordcount);
        let randomword = this.words[randomitem];
        if (i != aposition) this.answers[i] = { text: this.verbTree[randomword]['translation'], word: randomword }; //
      }
    }
    else {
      this.question = this.verbTree[this.word]['translation']
      this.answers[aposition] = { text: this.word, word: this.word };

      // fill the rest of the answers with descriptions
      for (let i = 0; i < this.answers.length; i++) {
        let randomitem = Math.floor(Math.random() * this.maxwordcount);
        let randomword = this.words[randomitem];
        if (i != aposition) this.answers[i] = { text: randomword, word: randomword }; //
      }
    }
  }

  cleanList() {
    let confirm = this.alerCtrl.create({
      title: 'Remove list of words?',
      message: 'Do you agree to?',
      buttons: [
        {
          text: 'Disagree'
        },
        {
          text: 'Agree',
          handler: () => {
            this.wrongwords = [];
            this.goodwords = [];
          }
        }
      ]
    });
    confirm.present()
  }

  swapMode() {
    if (this.mode == 'ES-EN') this.mode = 'EN-ES'
    else this.mode = 'ES-EN'
    this.nextQuestion();
  }

  loadOthers() {
    this.http.get('assets/dict/spanishdict.json')
      .subscribe((data) => {

        this.otherTree = {};

        // let excludedt = ['{prop}', '{v}', '{suffix}', '{prefix}'];
        let includet = ['{f}', '{m}'];

        let sets = data['dic']['l'];
       // let count = 0;
        sets.map(set => {
          let wordsinset = set['w'];
          wordsinset.map(word => {
            if (includet.indexOf(word.t) > -1) {
         //     count += 1;
              // if (Math.floor(Math.random() * 10) > 4)
              this.otherTree[word.c] = { translation: word.d, type: word.t }
            }
          })
        })

        console.log('SEE DATA', Object.keys(this.otherTree).length, this.otherTree);
      })
  }

  loadVerbs() {
    //this.loadOthers();
    this.storage.get('verbTree')
      .then((val) => {
        if (val) {
          console.log('Gotten from store')
          this.verbTree = val;
//          return Promise.resolve(true)
        }
        else return this.http.get('assets/dict/jehle_verb_database.csv', { responseType: 'text' })
          .toPromise()
          .then((data) => {
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

            console.log('Gotten from http')
            this.storage.set('verbTree', this.verbTree);
          })
      })
      .then(() => {
        if (this.verbTree['1infinitive']) delete this.verbTree['1infinitive'];
        this.words = Object.keys(this.verbTree);
        this.maxwordcount = this.words.length;
        console.log('VERBTREE', this.verbTree, this.maxwordcount);
        this.nextQuestion();
      })
  }
}
