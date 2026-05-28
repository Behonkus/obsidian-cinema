import { useState } from "react";
import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { FileDown, List, LayoutGrid, Loader2 } from "lucide-react";

const FIELD_OPTIONS = [
  { id: 'title', label: 'Title', default: true },
  { id: 'year', label: 'Year', default: true },
  { id: 'rating', label: 'Rating', default: true },
  { id: 'genres', label: 'Genres', default: true },
  { id: 'file_name', label: 'File Name', default: false },
  { id: 'file_path', label: 'File Path', default: false },
  { id: 'cast', label: 'Cast (top 3)', default: false },
  { id: 'overview', label: 'Synopsis', default: false },
];

function getFieldValue(movie, fieldId) {
  switch (fieldId) {
    case 'title': return movie.title || movie.file_name || 'Untitled';
    case 'year': return movie.year || '—';
    case 'rating': return movie.tmdb_rating ? Number(movie.tmdb_rating).toFixed(1) : '—';
    case 'genres': return (movie.genres || []).join(', ') || '—';
    case 'file_name': return movie.file_name || '—';
    case 'file_path': return movie.file_path || '—';
    case 'cast': return (movie.cast || []).slice(0, 3).map(function(c) { return c.name || c; }).join(', ') || '—';
    case 'overview': return movie.overview ? (movie.overview.length > 120 ? movie.overview.substring(0, 120) + '...' : movie.overview) : '—';
    default: return '—';
  }
}

async function loadImageAsDataUrl(url) {
  return new Promise(function(resolve) {
    var img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = function() {
      var canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.getContext('2d').drawImage(img, 0, 0);
      try { resolve(canvas.toDataURL('image/jpeg', 0.6)); } catch (e) { resolve(null); }
    };
    img.onerror = function() { resolve(null); };
    img.src = url;
    setTimeout(function() { resolve(null); }, 3000);
  });
}

function generateListPDF(movies, fields, listTitle) {
  var doc = new jsPDF('portrait', 'mm', 'a4');
  var pageW = doc.internal.pageSize.getWidth();
  
  // Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(listTitle, pageW / 2, 18, { align: 'center' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120);
  doc.text(movies.length + ' movies  |  Generated ' + new Date().toLocaleDateString(), pageW / 2, 25, { align: 'center' });
  doc.setTextColor(0);

  var headers = fields.map(function(f) { return FIELD_OPTIONS.find(function(o) { return o.id === f; })?.label || f; });
  var body = movies.map(function(m, i) {
    return fields.map(function(f) { return getFieldValue(m, f); });
  });

  autoTable(doc, {
    startY: 30,
    head: [headers],
    body: body,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [180, 30, 60], textColor: 255, fontStyle: 'bold', fontSize: 8 },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    margin: { left: 10, right: 10 },
    didDrawPage: function(data) {
      // Footer
      doc.setFontSize(7);
      doc.setTextColor(150);
      doc.text('Obsidian Cinema', 10, doc.internal.pageSize.getHeight() - 6);
      doc.text('Page ' + doc.internal.getNumberOfPages(), pageW - 10, doc.internal.pageSize.getHeight() - 6, { align: 'right' });
    }
  });

  return doc;
}

async function generateGridPDF(movies, fields, listTitle, setProgress) {
  var doc = new jsPDF('portrait', 'mm', 'a4');
  var pageW = doc.internal.pageSize.getWidth();
  var pageH = doc.internal.pageSize.getHeight();
  var margin = 10;
  var cols = 4;
  var cellW = (pageW - margin * 2) / cols;
  var posterH = cellW * 1.5;
  var cellH = posterH + 22;
  var rows = Math.floor((pageH - 40 - margin) / cellH);
  
  // Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(listTitle, pageW / 2, 18, { align: 'center' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120);
  doc.text(movies.length + ' movies  |  Generated ' + new Date().toLocaleDateString(), pageW / 2, 25, { align: 'center' });
  doc.setTextColor(0);

  var startY = 32;
  var x, y, col, row;
  
  for (var i = 0; i < movies.length; i++) {
    col = i % cols;
    row = Math.floor((i % (cols * rows)) / cols);
    
    if (i > 0 && i % (cols * rows) === 0) {
      doc.addPage();
      startY = 12;
    }
    
    x = margin + col * cellW;
    y = startY + row * cellH;
    
    // Poster placeholder
    doc.setFillColor(30, 30, 30);
    doc.roundedRect(x + 1, y, cellW - 2, posterH, 2, 2, 'F');
    
    // Try to load poster
    if (movies[i].poster_path) {
      if (setProgress) setProgress(Math.round((i / movies.length) * 100));
      var imgData = await loadImageAsDataUrl(movies[i].poster_path);
      if (imgData) {
        try {
          doc.addImage(imgData, 'JPEG', x + 1, y, cellW - 2, posterH);
        } catch (e) {}
      }
    }
    
    // Title below poster
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    var title = (movies[i].title || movies[i].file_name || 'Untitled');
    if (title.length > 25) title = title.substring(0, 24) + '...';
    doc.text(title, x + cellW / 2, y + posterH + 5, { align: 'center', maxWidth: cellW - 2 });
    
    // Year + rating
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    var sub = '';
    if (movies[i].year) sub += movies[i].year;
    if (movies[i].tmdb_rating) sub += (sub ? '  |  ' : '') + Number(movies[i].tmdb_rating).toFixed(1) + '/10';
    if (sub) doc.text(sub, x + cellW / 2, y + posterH + 10, { align: 'center' });
    
    // Footer on each page
    doc.setFontSize(7);
    doc.setTextColor(150);
    doc.text('Obsidian Cinema', 10, pageH - 6);
    doc.text('Page ' + doc.internal.getNumberOfPages(), pageW - 10, pageH - 6, { align: 'right' });
  }
  
  return doc;
}

export default function PdfExportDialog({ movies, listTitle, trigger, autoOpen, onClose }) {
  var [open, setOpen] = useState(autoOpen || false);
  var [fields, setFields] = useState(function() {
    return FIELD_OPTIONS.filter(function(f) { return f.default; }).map(function(f) { return f.id; });
  });
  var [layout, setLayout] = useState('list');
  var [exporting, setExporting] = useState(false);
  var [progress, setProgress] = useState(0);

  function toggleField(id) {
    setFields(function(prev) {
      if (prev.includes(id)) {
        if (id === 'title') return prev; // Title always required
        return prev.filter(function(f) { return f !== id; });
      }
      return prev.concat([id]);
    });
  }

  async function handleExport() {
    if (!movies || movies.length === 0) return;
    setExporting(true);
    setProgress(0);
    
    var title = listTitle || 'My Movie List';
    var doc;
    
    try {
      if (layout === 'grid') {
        doc = await generateGridPDF(movies, fields, title, setProgress);
      } else {
        doc = generateListPDF(movies, fields, title);
      }
      
      var fileName = title.replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, '_').toLowerCase();
      doc.save(fileName + '.pdf');
    } catch (e) {
      console.error('PDF export failed:', e);
    }
    
    setExporting(false);
    setOpen(false);
    if (onClose) onClose();
  }

  return (
    <>
      {trigger && <span onClick={function() { setOpen(true); }}>{trigger}</span>}
      <Dialog open={open} onOpenChange={function(v) { setOpen(v); if (!v && onClose) onClose(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileDown className="w-5 h-5 text-primary" />
              Export PDF
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Movie count */}
            <p className="text-sm text-muted-foreground">
              Exporting <strong>{movies?.length || 0}</strong> movies as PDF
            </p>

            {/* Layout choice */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Layout</p>
              <div className="flex gap-2">
                <Button
                  variant={layout === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={function() { setLayout('list'); }}
                  className="flex-1 text-xs"
                  data-testid="pdf-layout-list"
                >
                  <List className="w-3.5 h-3.5 mr-1.5" />
                  List
                </Button>
                <Button
                  variant={layout === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={function() { setLayout('grid'); }}
                  className="flex-1 text-xs"
                  data-testid="pdf-layout-grid"
                >
                  <LayoutGrid className="w-3.5 h-3.5 mr-1.5" />
                  Grid with Posters
                </Button>
              </div>
            </div>

            {/* Field selection (list mode only) */}
            {layout === 'list' && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Columns to include</p>
                <div className="flex flex-wrap gap-1.5">
                  {FIELD_OPTIONS.map(function(f) {
                    var active = fields.includes(f.id);
                    return (
                      <Badge
                        key={f.id}
                        variant={active ? 'default' : 'outline'}
                        className={'cursor-pointer text-xs ' + (f.id === 'title' && active ? 'opacity-70 cursor-not-allowed' : '')}
                        onClick={function() { toggleField(f.id); }}
                        data-testid={'pdf-field-' + f.id}
                      >
                        {f.label}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Progress */}
            {exporting && layout === 'grid' && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Loading posters... {progress}%
                </div>
                <div className="w-full bg-secondary rounded-full h-1.5 overflow-hidden">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: progress + '%' }} />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={function() { setOpen(false); }} disabled={exporting}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleExport} disabled={exporting || !movies?.length} data-testid="pdf-export-btn">
              {exporting ? (
                <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Generating...</>
              ) : (
                <><FileDown className="w-3.5 h-3.5 mr-1.5" /> Export PDF</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
