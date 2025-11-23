import { Component, EventEmitter, CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA, Output, Input, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
// Importations individuelles des composants Material
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialogModule } from '@angular/material/dialog';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

// Import du composant et des types nécessaires
import { ImageCropperComponent, ImageCroppedEvent, ImageTransform } from 'ngx-image-cropper';
import { ImageCompressionService } from '../../services/image-compression.service';

@Component({
  selector: 'app-image-cropper-dialog',
  templateUrl: './image-cropper-dialog.component.html',
  styleUrls: ['./image-cropper-dialog.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
    ImageCropperComponent
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
})
export class ImageCropperDialogComponent {
  @Output() imageCroppedEvent = new EventEmitter<string>();
  @Output() cancelEvent = new EventEmitter<void>();
  
  @Input() aspectRatio: number = 4/3;
  @Input() cropperWidth: number = 400;
  @Input() cropperHeight: number = 300;
  @Input() dialogTitle: string = "Recadrer l'image";
  @Input() confirmButtonText: string = "Confirmer";
  @Input() cancelButtonText: string = "Annuler";
  @Input() overlayColor: string = "rgba(0,0,0,0.7)";
  
  imageChangedEvent: any = null;
  croppedImage: SafeUrl = '';
  rawBase64Image: string = ''; 
  fileName: string = '';
  
  canvasRotation = 0;
  rotation = 0;
  scale = 1;
  transform: ImageTransform = {};
  
  imageScale = 1;
  
  private readonly MAX_ZOOM = 3;
  private readonly MIN_ZOOM = 0.5;
  
  constructor(
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef,
    private imageCompression: ImageCompressionService,
  ) {}

  fileChangeEvent(event: any): void {
    this.resetImageTransformValues();
    this.imageChangedEvent = event;
    if (event.target.files && event.target.files.length > 0) {
      this.fileName = event.target.files[0].name;
    }
  }
  
  triggerFileInput(): void {
    document.getElementById('fileInput')?.click();
  }
  
  async imageCropped(event: ImageCroppedEvent): Promise<void> {
    if (event.blob) {
      const reader = new FileReader();
      reader.onload = async (e: any) => {
        const base64 = e.target.result;

        try {
          const compressedImage = await this.imageCompression.compressImage(base64, 800, 0.85);

          this.rawBase64Image = compressedImage.base64;
          this.croppedImage = this.sanitizer.bypassSecurityTrustUrl(compressedImage.base64);

          console.log('Dimensions de l\'image compressée:', {
            width: compressedImage.width,
            height: compressedImage.height
          });
        } catch (error) {
          console.error('Erreur lors de la compression:', error);
        }
      };
      reader.readAsDataURL(event.blob);
    }
  }
  
  imageLoaded(): void {
    console.log('Image chargée');
  }
  
  cropperReady(): void {
    console.log('Cropper prêt');
  }
  
  loadImageFailed(): void {
    console.error("L'image n'a pas pu être chargée");
  }
  
  updateImageScale(): void {
    this.scale = this.imageScale;
    this.updateImageTransform();
  }
  
  rotateLeft(): void {
    this.canvasRotation--;
    this.flipAfterRotate();
  }
  
  rotateRight(): void {
    this.canvasRotation++;
    this.flipAfterRotate();
  }
  
  resetImage(): void {
    this.resetImageTransformValues();
    this.imageScale = 1;
    this.updateImageTransform();
  }
  
  updateImageTransform(): void {
    this.transform = {
      ...this.transform,
      scale: this.scale,
      rotate: this.rotation
    };
  }
  
  resetImageTransformValues(): void {
    this.scale = 1;
    this.rotation = 0;
    this.canvasRotation = 0;
    this.transform = {};
    this.imageScale = 1;
  }
  
  private flipAfterRotate() {
    const flippedH = this.transform.flipH;
    const flippedV = this.transform.flipV;
    this.transform = {
      ...this.transform,
      flipH: flippedV,
      flipV: flippedH
    };
  }
  
  /**
   * Retourne l'image recadrée en format base64 sans le préfixe
   * Utile pour l'envoyer à une API ou la stocker en base de données
   */
  getBase64WithoutPrefix(): string {
    if (!this.rawBase64Image) return '';
    
    // Supprimer le préfixe 'data:image/png;base64,' pour obtenir uniquement les données
    return this.rawBase64Image.replace(/^data:image\/(png|jpg|jpeg);base64,/, '');
  }
  
  closeDialog(): void {
    this.cancelEvent.emit();
  }
  
  confirmCrop(): void {
    if (this.rawBase64Image) {
      this.imageCroppedEvent.emit(this.rawBase64Image);
    }
  }
}

