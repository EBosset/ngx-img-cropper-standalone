import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ImageCropperDialogComponent } from './components/image-cropper-dialog/image-cropper-dialog.component';

/**
 * Exemple d'utilisation du composant ImageCropperDialog dans une application
 */
@Component({
  selector: 'app-example',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="container">
      <h1>Exemple d'utilisation du recadreur d'image</h1>
      
      <!-- Bouton pour ouvrir la popup de recadrage -->
      <button mat-raised-button color="primary" (click)="openImageCropperDialog()">
        <mat-icon>add_photo_alternate</mat-icon>
        Ajouter une image
      </button>
      
      <!-- Affichage de l'image recadrée si disponible -->
      <div *ngIf="croppedImage" class="cropped-image-container">
        <h2>Image recadrée :</h2>
        <img [src]="croppedImage" alt="Image recadrée" class="cropped-image">

        <div class="cropped-info" *ngIf="croppedWidth && croppedHeight && croppedSizeKb !== null">
          <p>Dimensions : {{ croppedWidth }} × {{ croppedHeight }} px</p>
          <p>Taille estimée : {{ croppedSizeKb }} Ko</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    
    .cropped-image-container {
      margin-top: 20px;
      text-align: center;
    }
    
    .cropped-image {
      max-width: 100%;
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }

    .cropped-info {
      margin-top: 12px;
      font-size: 0.9rem;
      color: #444;
    }
  `]
})
export class ExampleComponent {
  croppedImage: string | null = null;
  croppedWidth: number | null = null;
  croppedHeight: number | null = null;
  croppedSizeKb: number | null = null;
  
  constructor(private dialog: MatDialog) {}
  openImageCropperDialog(): void {
    const dialogRef = this.dialog.open(ImageCropperDialogComponent, {
      width: '600px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      panelClass: 'image-cropper-dialog',
      disableClose: true
    });

    const componentInstance = dialogRef.componentInstance;

    componentInstance.imageCroppedEvent.subscribe((base64Image: string) => {
      console.log('Image recadru00e9e reu00e7ue');
      this.croppedImage = base64Image;
      this.updateCroppedImageInfo(base64Image);
      dialogRef.close();
    });

    componentInstance.cancelEvent.subscribe(() => {
      console.log('Recadrage annulu00e9');
      dialogRef.close();
    });
  }

  private updateCroppedImageInfo(base64Image: string): void {
    // Estimation de la taille en Ko à partir de la longueur base64
    const base64Data = base64Image.includes('base64,')
      ? base64Image.split('base64,')[1]
      : base64Image;

    const length = base64Data.length;
    const bytes = Math.ceil((length * 3) / 4);
    this.croppedSizeKb = Math.round(bytes / 1024);

    // Récupération des dimensions via un objet Image
    const img = new Image();
    img.onload = () => {
      this.croppedWidth = img.width;
      this.croppedHeight = img.height;
    };
    img.src = base64Image;
  }
}
