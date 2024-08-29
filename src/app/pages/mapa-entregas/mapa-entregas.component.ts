/// <reference types="@types/google.maps" />
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-mapa-entregas',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './mapa-entregas.component.html',
  styleUrls: ['./mapa-entregas.component.css']
})
export class MapaEntregasComponent implements OnInit {

  originAddress: string = 'Rua Maranhão, 575, Praia da Costa';  
  destinationAddress: string = 'Jardim da Penha, Rua José Neves Cypreste'; 

  private map!: google.maps.Map;
  private directionsService!: google.maps.DirectionsService;
  private directionsRenderer!: google.maps.DirectionsRenderer;
  private geocoder!: google.maps.Geocoder;
  private motoboyMarker!: google.maps.Marker;
  private routePolyline!: google.maps.Polyline;
  private estimatedArrivalTime!: Date;

  constructor() { }

  ngOnInit(): void {
    this.loadMap();
  }

  loadMap(): void {
    if (typeof google !== 'undefined' && google.maps) {
      const mapStyles = [
        {
          "featureType": "administrative",
          "elementType": "geometry",
          "stylers": [
            { "visibility": "off" }
          ]
        },
        // Outros estilos que você configurou
      ];

      this.map = new google.maps.Map(document.getElementById("map") as HTMLElement, {
        center: { lat: -23.55052, lng: -46.633308 },
        zoom: 12,
        styles: mapStyles
      });

      this.directionsService = new google.maps.DirectionsService();
      this.directionsRenderer = new google.maps.DirectionsRenderer();
      this.directionsRenderer.setMap(this.map);
      this.geocoder = new google.maps.Geocoder();

      // Ícone do motoboy
      this.motoboyMarker = new google.maps.Marker({
        map: this.map,
        icon: {
          url: 'https://developers.google.com/maps/documentation/javascript/examples/full/images/beachflag.png',
          scaledSize: new google.maps.Size(50, 50)
        }
      });

      this.onCalculateRoute(); // Calcular rota ao carregar o mapa
      this.startRealTimeLocationUpdates(); // Começar a atualização em tempo real
    } else {
      console.error('Google Maps API não carregada ou não encontrada');
    }
  }

  onCalculateRoute(): void {
    this.geocodeAddress(this.originAddress, (origin) => {
      this.geocodeAddress(this.destinationAddress, (destination) => {
        this.calculateRoute(origin, destination);
      });
    });
  }

  geocodeAddress(address: string, callback: (location: google.maps.LatLng) => void): void {
    this.geocoder.geocode({ address: address }, (results, status) => {
      if (status === google.maps.GeocoderStatus.OK && results![0]) {
        const location = results![0].geometry.location;
        callback(location);
      } else {
        console.error('Erro ao geocodificar o endereço:', status);
      }
    });
  }

  calculateRoute(origin: google.maps.LatLng, destination: google.maps.LatLng): void {
    const request: google.maps.DirectionsRequest = {
      origin: origin,
      destination: destination,
      travelMode: google.maps.TravelMode.DRIVING
    };

    this.directionsService.route(request, (result, status) => {
      if (status === google.maps.DirectionsStatus.OK) {
        this.directionsRenderer.setDirections(result);

        this.routePolyline = new google.maps.Polyline({
          path: result!.routes[0].overview_path,
          strokeColor: "#FF0000",
          strokeOpacity: 1.0,
          strokeWeight: 3,
          map: this.map
        });

        this.calculateEstimatedArrivalTime(result!.routes[0].legs[0]);
      } else {
        console.error('Erro ao calcular a rota:', status);
      }
    });
  }

  calculateEstimatedArrivalTime(leg: google.maps.DirectionsLeg): void {
    this.estimatedArrivalTime = new Date();
    this.estimatedArrivalTime.setSeconds(this.estimatedArrivalTime.getSeconds() + leg.duration!.value);
  }

  startRealTimeLocationUpdates(): void {
    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(
        position => {
          const newLocation = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
          this.motoboyMarker.setPosition(newLocation);
          this.map.panTo(newLocation);

          this.calculateUpdatedETA(newLocation);
        },
        error => {
          console.error('Erro ao obter a localização:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    } else {
      console.error('Geolocalização não é suportada pelo seu navegador.');
    }
  }

  calculateUpdatedETA(currentPosition: google.maps.LatLng): void {
    const remainingDistance = google.maps.geometry.spherical.computeDistanceBetween(
      currentPosition,
      this.routePolyline.getPath().getAt(this.routePolyline.getPath().getLength() - 1)
    );

    const speed = 50; // Suponha uma velocidade constante de 50 km/h
    const timeToDestination = (remainingDistance / 1000) / speed * 3600 * 1000;
    this.estimatedArrivalTime.setTime(new Date().getTime() + timeToDestination);
  }

  getEstimatedArrivalTime(): string {
    const now = new Date();
    const timeLeft = Math.max(this.estimatedArrivalTime.getTime() - now.getTime(), 0);
    const minutes = Math.floor(timeLeft / 60000);
    const seconds = Math.floor((timeLeft % 60000) / 1000);
    return `${minutes}m ${seconds}s restantes`;
  }
}
