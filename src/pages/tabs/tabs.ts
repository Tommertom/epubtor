import { ViewChild, Component } from '@angular/core';

import { AboutPage } from '../about/about';
import { ContactPage } from '../contact/contact';
import { HomePage } from '../home/home';
import { ActivePage } from '../active/active';
import { Storage } from '@ionic/storage';

import { Tabs } from 'ionic-angular';

@Component({
  templateUrl: 'tabs.html'
})
export class TabsPage {

  tab1Root = HomePage;
  tab2Root = AboutPage;
  tab3Root = ContactPage;
  tab4Root = ActivePage;

  @ViewChild('myTab') tabRef: Tabs;
 //<ion-tab [root]="tab4Root" tabTitle="Active" tabIcon="help"></ion-tab>
  constructor(private storage: Storage) {
    this.storage.get('lastTabSelected').then(val => {
      let tabIndex;
      console.log('Getting tabindex',val)
      if (val) tabIndex = val
      else tabIndex = 0;
      this.tabRef.select(tabIndex);
    })
  }

  tabChange(event) {
    console.log('settab', event.index)
    this.storage.set('lastTabSelected', event.index)
  }

}
