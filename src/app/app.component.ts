import { Component, CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

import { ImageCropperDialogComponent } from './components/image-cropper-dialog/image-cropper-dialog.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
})
export class AppComponent {
  title = 'cropper';
  croppedImage: SafeUrl = '';
  rawBase64Image: string = '';
  croppedWidth: number | null = null;
  croppedHeight: number | null = null;
  croppedSizeKb: number | null = null;

  constructor(private sanitizer: DomSanitizer, private dialog: MatDialog) {}

  openImageCropperDialog(): void {

    const dialogRef = this.dialog.open(ImageCropperDialogComponent, {
      width: '600px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      panelClass: 'image-cropper-dialog'
    });

    dialogRef.componentInstance.imageCroppedEvent.subscribe((base64Image: string) => {
      this.rawBase64Image = base64Image;
      this.croppedImage = this.sanitizer.bypassSecurityTrustUrl(base64Image);
      this.updateCroppedImageInfo(base64Image);
      dialogRef.close();
    });

    dialogRef.componentInstance.cancelEvent.subscribe(() => {
      dialogRef.close();
    });
  }

  getBase64WithoutPrefix(): string {

    if (this.rawBase64Image && this.rawBase64Image.includes('base64,')) {
      return this.rawBase64Image.split('base64,')[1];
    }
    return this.rawBase64Image;
  }

  private updateCroppedImageInfo(base64Image: string): void {
    const base64Data = base64Image.includes('base64,')
      ? base64Image.split('base64,')[1]
      : base64Image;

    const length = base64Data.length;
    const bytes = Math.ceil((length * 3) / 4);
    this.croppedSizeKb = Math.round(bytes / 1024);

    const img = new Image();
    img.onload = () => {
      this.croppedWidth = img.width;
      this.croppedHeight = img.height;
    };
    img.src = base64Image;
  }
}