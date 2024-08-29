import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MapaEntregasComponent } from "./pages/mapa-entregas/mapa-entregas.component";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MapaEntregasComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'maps';
}
