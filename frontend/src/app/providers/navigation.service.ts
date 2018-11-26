import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class NavigationService {

  constructor(private router: Router) { }

  goToCreateNewVisit(params?): void {
    this.router.navigate(['visits/new'], params)
  }
  goToCreateNewPatient(params?): void {
    this.router.navigate(['patients/new'], params)
  }
  goToVisitsOverview(params?): void {
    this.router.navigate(['visits'], params)
  }
  goToViewVistDetail(id): void {
    this.router.navigate(['visits/',id])
  }
  goToEditVistDetail(id): void {
    this.router.navigate(['visits/',id,'edit'])
  }
  goToEnterVisitResults(id):void{
    this.router.navigate(['visits/',id,'results'])
  }
}