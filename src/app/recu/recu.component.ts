import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { createWorker } from 'tesseract.js';
import jsPDF from 'jspdf';

@Component({
  selector: 'app-recu',
  standalone: true,
  templateUrl: './recu.component.html',
  styleUrls: ['./recu.component.css'],
  imports: [CommonModule, FormsModule]
})
export class RecuComponent {
  file: File | null = null;
  loading = false;
  receiptData: any = null;
  userName: string = ''; // Champ pour saisir le nom de l'utilisateur

  async onFileChange(event: any) {
    if (event.target.files.length > 0) {
      this.file = event.target.files[0];
    }
  }

  async onUpload() {
    if (!this.file) return;
    
    this.loading = true;
    const worker = await createWorker('fra'); // OCR en français

    const image = URL.createObjectURL(this.file);
    const { data } = await worker.recognize(image);
    await worker.terminate();

    this.receiptData = this.extractData(data.text);
    this.loading = false;
  }

  extractData(text: string) {
    const lines = text.split('\n').map((line) => line.trim());
  
    const getValueBelow = (label: string) => {
      const index = lines.findIndex((line) => line.includes(label));
      return index !== -1 && index + 1 < lines.length ? lines[index + 1] : 'Non trouvé';
    };
  
    const montant = getValueBelow('MONTANT');
  
    return {
      ReferenceTransaction: getValueBelow('REFERENCE DE LA TRANSACTION'),
      DateTransaction: getValueBelow('DATE DE TRANSACTION'),
      TypeTransaction: getValueBelow('TYPE DE TRANSACTION'),
      ReferenceFacture: getValueBelow('REFERENCE DE LE FACTURE'),
      NumeroClient: getValueBelow('NUMERO CLIENT'),
      Montant: montant,
      Frais: this.calculerFrais(montant), // Calculer les frais ici
      Total: this.calculerTotal(montant), // Calculer le total ici
    };
  }
  
  calculerFrais(montant: string) {
    const montantNum = parseFloat(montant.replace(/\D/g, '')) || 0; // Convertir le montant en nombre
    return (montantNum * 0.01).toFixed(2); // Calculer 1 % du montant
  }
  
  calculerTotal(montant: string) {
    const montantNum = parseFloat(montant.replace(/\D/g, '')) || 0; // Convertir le montant en nombre
    const fraisNum = parseFloat(this.calculerFrais(montant)) || 0; // Récupérer les frais calculés
    return (montantNum + fraisNum).toFixed(2); // Retourner le total
  }

  generateReceipt() {
    if (!this.receiptData) {
        console.error("Aucune donnée de reçu disponible.");
        return;
    }

    const doc = new jsPDF();

    // Ajouter un logo (optionnel)
    const img = new Image();
    img.src = 'images/logo1.jpeg';
    img.onload = () => {
        doc.addImage(img, 'JPEG', 10, 10, 50, 20);
        
        // Ajout du nom de l'entreprise, email et numéro
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text('BICONSULTING', 140, 15); // Ajustez la position selon besoin
        doc.text('diarrabicons@gmail.com', 140, 20);
        doc.text('Numéro: +221 78 705 67 67', 140, 25);
        
        // Ajouter la signature
        this.addTextToPDF(doc);
    };
}

private addTextToPDF(doc: jsPDF) {
    if (!this.receiptData) return;

    // Titre
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text('Détail du Reçu de Paiement', 105, 60, { align: 'center' });
    
    // Nom du client
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text('Nom:', 10, 80);
    doc.setFont("helvetica", "normal");
    doc.text(this.userName || 'Non renseigné', 80, 80);
    
    // Les autres informations extraites
    doc.setFont("helvetica", "bold");
    doc.text('Référence Transaction:', 10, 90);
    doc.setFont("helvetica", "normal");
    doc.text(this.receiptData.ReferenceTransaction, 80, 90);

    doc.setFont("helvetica", "bold");
    doc.text('Date Transaction:', 10, 100);
    doc.setFont("helvetica", "normal");
    doc.text(this.receiptData.DateTransaction, 80, 100);

    doc.setFont("helvetica", "bold");
    doc.text('Type Transaction:', 10, 110);
    doc.setFont("helvetica", "normal");
    doc.text(this.receiptData.TypeTransaction, 80, 110);

    doc.setFont("helvetica", "bold");
    doc.text('Référence Facture:', 10, 120);
    doc.setFont("helvetica", "normal");
    doc.text(this.receiptData.ReferenceFacture, 80, 120);

    doc.setFont("helvetica", "bold");
    doc.text('Numéro Client:', 10, 130);
    doc.setFont("helvetica", "normal");
    doc.text(this.receiptData.NumeroClient, 80, 130);

    doc.setFont("helvetica", "bold");
    doc.text('Montant:', 10, 140);
    doc.setFont("helvetica", "normal");
    doc.text(this.receiptData.Montant + ' FCFA', 80, 140);

    doc.setFont("helvetica", "bold");
    doc.text('Frais:', 10, 150);
    doc.setFont("helvetica", "normal");
    doc.text(this.receiptData.Frais + ' FCFA', 80, 150);

    doc.setFont("helvetica", "bold");
    doc.text('Total:', 10, 160);
    doc.setFont("helvetica", "normal");
    doc.text(this.receiptData.Total + ' FCFA', 80, 160);


    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text('Signature agent:', 20, 190);
    // Ajouter la signature
    const signatureImg = new Image();
    signatureImg.src = 'images/signature.png';
    signatureImg.onload = () => {
        doc.addImage(signatureImg, 'PNG', 10, 195, 50, 20);
        doc.save('recu.pdf');
    };
}

}
