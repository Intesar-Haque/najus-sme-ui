import { Component } from '@angular/core';
import {NzLayoutModule} from 'ng-zorro-antd/layout';
import {NzButtonModule} from 'ng-zorro-antd/button';
import {NzTypographyModule} from 'ng-zorro-antd/typography';
import {RouterLink, RouterOutlet} from '@angular/router';
import {NzGridModule} from 'ng-zorro-antd/grid';
import {NzIconModule} from 'ng-zorro-antd/icon';
import {NzTagModule} from 'ng-zorro-antd/tag';
import {TranslateModule, TranslateService} from '@ngx-translate/core';
import {NzDropDownModule} from 'ng-zorro-antd/dropdown';

@Component({
  selector: 'app-root',
  imports: [
    NzLayoutModule,
    NzButtonModule,
    NzTypographyModule,
    RouterOutlet,
    NzGridModule,
    NzIconModule,
    NzTagModule,
    TranslateModule,
    NzDropDownModule
  ],
  templateUrl: './app.html',
  styleUrl: './app.less'
})
export class App {

  lang:'en' | 'bn' = 'en';

  constructor(private translate: TranslateService) {
    this.translate.addLangs(['bn', 'en']);
    this.translate.setDefaultLang('en');
    this.switchLang(localStorage.getItem('lang') == 'bn'? 'bn' : 'en');
  }

  switchLang(lang: 'en' | 'bn') {
    this.lang = lang;
      localStorage.setItem('lang', lang);
    this.translate.use(lang);
    document.body.classList.remove('lang-en', 'lang-bn');
    document.body.classList.add(`lang-${lang}`);
  }

}
