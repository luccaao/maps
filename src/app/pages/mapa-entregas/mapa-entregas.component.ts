/// <reference types="@types/google.maps" />
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-mapa-entregas',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './mapa-entregas.component.html',
  styleUrls: ['./mapa-entregas.component.css']
})
export class MapaEntregasComponent implements OnInit {

  originAddress: string = '';  
  destinationAddress: string = ''; 
  mapVisible: boolean = false;
  

  private map!: google.maps.Map;
  private directionsService!: google.maps.DirectionsService;
  private directionsRenderer!: google.maps.DirectionsRenderer;
  private geocoder!: google.maps.Geocoder;
  private motoboyMarker!: google.maps.Marker;
  private routePolyline: google.maps.Polyline | null = null;

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
          "elementType": "all",
          "stylers": [
            { "visibility": "off" }
          ]
        },
        {
          "featureType": "poi",
          "elementType": "all",
          "stylers": [
            { "visibility": "off" }
          ]
        },
        {
          "featureType": "transit",
          "elementType": "all",
          "stylers": [
            { "visibility": "off" }
          ]
        },
        {
          "featureType": "road",
          "elementType": "geometry",
          "stylers": [
            { "visibility": "on" }
          ]
        },
        {
          "featureType": "road",
          "elementType": "labels.icon",
          "stylers": [
            { "visibility": "off" }
          ]
        },
        {
          "featureType": "road",
          "elementType": "labels.text.fill",
          "stylers": [
            { "color": "#000000" } // Cor dos nomes das ruas
          ]
        },
        {
          "featureType": "road",
          "elementType": "labels.text.stroke",
          "stylers": [
            { "visibility": "off" }
          ]
        },
        {
          "featureType": "water",
          "elementType": "all",
          "stylers": [
            { "visibility": "off" }
          ]
        },
        {
          "featureType": "landscape",
          "elementType": "all",
          "stylers": [
            { "visibility": "off" }
          ]
        }
      ];
  
      this.map = new google.maps.Map(document.getElementById("map") as HTMLElement, {
        center: { lat: -23.55052, lng: -46.633308 },
        zoom: 12,
        styles: mapStyles,
        disableDefaultUI: true,
      });
  
      this.directionsService = new google.maps.DirectionsService();
      this.directionsRenderer = new google.maps.DirectionsRenderer({
        suppressPolylines: true,
        suppressMarkers: true,
      });
      this.directionsRenderer.setMap(this.map);
      this.geocoder = new google.maps.Geocoder();
  
      this.motoboyMarker = new google.maps.Marker({
        map: this.map,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: 'black',
          fillOpacity: 1,
          strokeColor: 'orange',
          strokeWeight: 2,
          scale: 6, // Tamanho do ponto
        }
      });
  
      this.onCalculateRoute();
    } else {
      console.error('Google Maps API não carregada ou não encontrada');
    }
  }

  onCalculateRoute(): void {
    this.mapVisible = true;
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
        if (this.routePolyline) {
          this.routePolyline.setMap(null);
          this.routePolyline = null;
        }

        this.routePolyline = new google.maps.Polyline({
          path: result!.routes[0].overview_path,
          strokeColor: "#00acee",
          strokeOpacity: 1.0,
          strokeWeight: 4,
          map: this.map
        });

        this.calculateEstimatedArrivalTime(result!.routes[0].legs[0]);

        // Iniciar a simulação do movimento
        this.simulateMotoboyMovement(result!.routes[0].overview_path);
      } else {
        console.error('Erro ao calcular a rota:', status);
      }
    });
  }

  calculateEstimatedArrivalTime(leg: google.maps.DirectionsLeg): void {
    this.estimatedArrivalTime = new Date();
    this.estimatedArrivalTime.setSeconds(this.estimatedArrivalTime.getSeconds() + leg.duration!.value);
  }

  simulateMotoboyMovement(path: google.maps.LatLng[]): void {
    let step = 0;
    const speed = 50; // Velocidade em km/h
    const intervalTime = 1000; // Tempo em milissegundos para cada atualização (1 segundo)
    const stepDistance = (speed * 1000) / 3600 * (intervalTime / 1000); // Distância percorrida em cada intervalo

    const move = () => {
        if (step < path.length - 1) {
            const currentPosition = this.motoboyMarker.getPosition() || path[step];
            const nextPosition = path[step + 1];
            const distance = google.maps.geometry.spherical.computeDistanceBetween(currentPosition, nextPosition);

            if (distance < stepDistance) {
                step++;
                this.motoboyMarker.setPosition(nextPosition);

                // Remover o ponto percorrido do polyline
                const newPath = path.slice(step);
                this.routePolyline!.setPath(newPath);
            } else {
                const heading = google.maps.geometry.spherical.computeHeading(currentPosition, nextPosition);
                const newPosition = google.maps.geometry.spherical.computeOffset(currentPosition, stepDistance, heading);
                this.motoboyMarker.setPosition(newPosition);

                // Atualizar o polyline com a nova posição
                const updatedPath = this.routePolyline!.getPath().getArray();
                updatedPath[0] = newPosition; // Atualizar a posição inicial do caminho
                this.routePolyline!.setPath(updatedPath);
            }

            this.map.panTo(this.motoboyMarker.getPosition() as google.maps.LatLng);

            // Atualizar o tempo estimado de chegada
            this.calculateUpdatedETA(this.motoboyMarker.getPosition() as google.maps.LatLng);

            setTimeout(move, intervalTime);
        } else {
            console.log('Chegada ao destino.');
            this.motoboyMarker.setPosition(path[path.length - 1]); // Garante que o marcador finalize na posição final
        }
    };

    move();
}


  calculateUpdatedETA(currentPosition: google.maps.LatLng): void {
    const remainingDistance = google.maps.geometry.spherical.computeDistanceBetween(
      currentPosition,
      this.routePolyline!.getPath().getAt(this.routePolyline!.getPath().getLength() - 1)
    );

    const speed = 50; // Velocidade constante de 50 km/h
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
