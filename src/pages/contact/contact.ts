import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';


import { HttpClient } from '@angular/common/http';


@Component({
  selector: 'page-contact',
  templateUrl: 'contact.html'
})
export class ContactPage {

  verbList: Array<string> = [];
  items: Array<string> = [];
  conjugation: string = "";
  verbTree: Object = {};

  constructor(public navCtrl: NavController, private http: HttpClient) {
    this.loadVerbs();
  }

  onCancel() {
    this.items = Object.keys(this.verbTree);
  }

  getItems(ev) {
    // Reset items back to all of the items
    //    this.initializeItems();

    this.conjugation = "";

    this.items = Object.keys(this.verbTree);

    //console.log('items', this.items)
    // set val to the value of the ev target
    var val = ev.target.value;

    // if the value is an empty string don't filter the items
    if (val && val.trim() != '') {
      this.items = this.items.filter((item) => {
        return (item.toLowerCase().indexOf(val.toLowerCase()) > -1);
      })
    }
  }

  displayItem(item) {
   // console.log('TAT', this.verbTree[item])
    this.conjugation = JSON.stringify(this.verbTree[item], null, 2);
    this.items = [item];
    let b = document.getElementById('search');
    if (b) b.scrollIntoView({ behavior: "instant" });
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

        console.log('VERBTREE', this.verbTree);
        this.items = Object.keys(this.verbTree);
        //this.verbList = Object.keys(verbTree);
      })
  }


}
