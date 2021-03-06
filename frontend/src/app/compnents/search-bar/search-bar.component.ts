import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { startWith, map, tap } from 'rxjs/operators';

@Component({
  selector: 'app-search-bar',
  templateUrl: './search-bar.component.html',
  styleUrls: ['./search-bar.component.scss']
})
export class SearchBarComponent implements OnInit {
  tempData: any;
  constructor() { }
  myControl = new FormControl();
  filteredOptions: Observable<string[]>;
  @Input() data: any;
  @Output() result = new EventEmitter();


  ngOnInit() {
    this.filteredOptions = this.myControl.valueChanges
      .pipe(
        startWith(''),
        map(value => this._filter(value.toLowerCase()))
      );
  }

  emitFormValue(option) {
    this.result.emit(option);
  }

  private _filter(value: string): string[] {
    const filterValue = value;
    this.tempData = this.data;
    return this.tempData.filter(option => option['name'].toLowerCase().indexOf(filterValue) > -1);
  }
}

