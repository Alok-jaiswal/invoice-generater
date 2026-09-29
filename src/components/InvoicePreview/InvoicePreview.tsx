import React from 'react';
import { Invoice } from '../../types/invoice';
import { formatIndianNumber } from '../../utils/currency';
import { amountToWords } from '../../utils/amountToWords';

interface InvoicePreviewProps {
  invoice: Invoice;
  forPrint?: boolean;
}

const InvoicePreview = React.forwardRef<HTMLDivElement, InvoicePreviewProps>(
  ({ invoice, forPrint = false }, ref) => {
    const { business, customer, bank, signature, items, tax, discount, totals, currencyStyle } = invoice;

    const formatAmt = (amount: number) => {
      const formatted = formatIndianNumber(amount);
      if (currencyStyle === '₹amount/-') {
        const [intPart] = formatted.split('.');
        return `${intPart}/-`;
      }
      return `₹${formatted}`;
    };

    const hasBank = !!(bank.bankName || bank.accountNumber || bank.ifscCode);
    const hasSignature = !!(signature.image || signature.authorizedName);
    const hasTax = tax.enabled && (tax.cgst > 0 || tax.sgst > 0 || tax.igst > 0);
    const hasDiscount = discount.enabled && discount.value > 0 && totals.discountAmount > 0;
    const showSubsection = hasTax || hasDiscount;

    return (
      <div
        ref={ref}
        id="invoice-preview-content"
        style={{
          width: '794px',
          minHeight: '1123px',
          background: '#fff',
          fontFamily: "'Times New Roman', Times, serif",
          fontSize: '13px',
          color: '#1a1a1a',
          padding: '28px 32px',
          boxSizing: 'border-box',
          position: 'relative',
        }}
        className={forPrint ? 'print-invoice' : 'invoice-preview-inner'}
      >
        {/* ===== HEADER ===== */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: '10px',
          paddingBottom: '10px',
          borderBottom: '2.5px solid #1a1a1a',
        }}>
          {/* Logo */}
          <div style={{ width: '110px', minHeight: '70px', display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
            {business.logo ? (
              <img
                src={business.logo}
                alt="Logo"
                style={{ maxWidth: '110px', maxHeight: '80px', objectFit: 'contain' }}
              />
            ) : (
              <div style={{
                width: '80px', height: '70px', background: '#f5f5f5',
                border: '1px dashed #ccc', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '10px', color: '#aaa',
                textAlign: 'center', lineHeight: 1.2,
              }}>
                LOGO
              </div>
            )}
          </div>

          {/* Business Info - Center */}
          <div style={{ flex: 1, textAlign: 'center', padding: '0 12px' }}>
            <div style={{
              fontSize: '20px', fontWeight: 'bold', letterSpacing: '1.5px',
              textTransform: 'uppercase', marginBottom: '3px', color: '#111',
            }}>
              {business.name || 'BUSINESS NAME'}
            </div>
            {business.subtitle && (
              <div style={{ fontSize: '12.5px', fontStyle: 'italic', color: '#555', marginBottom: '3px' }}>
                {business.subtitle}
              </div>
            )}
            {(business.address || business.city || business.state) && (
              <div style={{ fontSize: '11.5px', color: '#444', lineHeight: '1.5' }}>
                {[business.address, business.city, business.state, business.pinCode].filter(Boolean).join(', ')}
              </div>
            )}
            {(business.phone1 || business.phone2 || business.email) && (
              <div style={{ fontSize: '11.5px', color: '#444', lineHeight: '1.5' }}>
                {[business.phone1, business.phone2].filter(Boolean).join(' / ')}
                {business.email ? ` | ${business.email}` : ''}
              </div>
            )}
            {(business.pan || business.gst) && (
              <div style={{ fontSize: '11px', color: '#555', marginTop: '2px' }}>
                {business.pan ? `PAN: ${business.pan}` : ''}
                {business.pan && business.gst ? '  |  ' : ''}
                {business.gst ? `GST: ${business.gst}` : ''}
              </div>
            )}
          </div>

          {/* Invoice Info - Right */}
          <div style={{ textAlign: 'right', minWidth: '130px' }}>
            <div style={{
              fontSize: '18px', fontWeight: 'bold', border: '2px solid #1a1a1a',
              padding: '3px 10px', display: 'inline-block', marginBottom: '8px',
              letterSpacing: '2px', color: '#111',
            }}>
              INVOICE
            </div>
            <div style={{ fontSize: '11.5px', color: '#333', lineHeight: '1.7' }}>
              <div><strong>No.:</strong> {invoice.invoiceNumber}</div>
              <div><strong>Date:</strong> {invoice.invoiceDate ? formatDate(invoice.invoiceDate) : '—'}</div>
              {invoice.dueDate && (
                <div><strong>Due:</strong> {formatDate(invoice.dueDate)}</div>
              )}
              {invoice.placeOfSupply && (
                <div><strong>Place:</strong> {invoice.placeOfSupply}</div>
              )}
            </div>
          </div>
        </div>

        {/* ===== BILL TO / FROM ===== */}
        <div style={{
          display: 'flex', marginBottom: '10px',
          border: '1px solid #1a1a1a',
        }}>
          {/* Bill To */}
          <div style={{ flex: 1, padding: '8px 12px', borderRight: '1px solid #1a1a1a' }}>
            <div style={{
              fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase',
              letterSpacing: '0.8px', borderBottom: '1px solid #888',
              paddingBottom: '3px', marginBottom: '6px', color: '#333',
            }}>
              Bill To
            </div>
            <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '3px', color: '#111' }}>
              {customer.name || '—'}
            </div>
            {customer.address && (
              <div style={{ fontSize: '11.5px', lineHeight: '1.4', color: '#333' }}>{customer.address}</div>
            )}
            {(customer.city || customer.state || customer.pinCode) && (
              <div style={{ fontSize: '11.5px', color: '#333' }}>
                {[customer.city, customer.state, customer.pinCode].filter(Boolean).join(', ')}
              </div>
            )}
            {customer.phone && (
              <div style={{ fontSize: '11.5px', color: '#333' }}>Ph: {customer.phone}</div>
            )}
            {customer.email && (
              <div style={{ fontSize: '11.5px', color: '#333' }}>Email: {customer.email}</div>
            )}
            {customer.pan && (
              <div style={{ fontSize: '10.5px', color: '#555' }}>PAN: {customer.pan}</div>
            )}
            {customer.gst && (
              <div style={{ fontSize: '10.5px', color: '#555' }}>GST: {customer.gst}</div>
            )}
          </div>

          {/* From */}
          <div style={{ flex: 1, padding: '8px 12px' }}>
            <div style={{
              fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase',
              letterSpacing: '0.8px', borderBottom: '1px solid #888',
              paddingBottom: '3px', marginBottom: '6px', color: '#333',
            }}>
              From
            </div>
            <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '3px', color: '#111' }}>
              {business.name || '—'}
            </div>
            {business.proprietorName && (
              <div style={{ fontSize: '11.5px', color: '#333' }}>Prop: {business.proprietorName}</div>
            )}
            {business.address && (
              <div style={{ fontSize: '11.5px', lineHeight: '1.4', color: '#333' }}>{business.address}</div>
            )}
            {(business.city || business.state || business.pinCode) && (
              <div style={{ fontSize: '11.5px', color: '#333' }}>
                {[business.city, business.state, business.pinCode].filter(Boolean).join(', ')}
              </div>
            )}
            {business.phone1 && (
              <div style={{ fontSize: '11.5px', color: '#333' }}>Ph: {business.phone1}</div>
            )}
            {business.pan && (
              <div style={{ fontSize: '10.5px', color: '#555' }}>PAN: {business.pan}</div>
            )}
            {business.gst && (
              <div style={{ fontSize: '10.5px', color: '#555' }}>GST: {business.gst}</div>
            )}
          </div>
        </div>

        {/* ===== ITEMS TABLE ===== */}
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #1a1a1a' }}>
          <thead>
            <tr style={{ background: '#2c2c2c', color: '#fff' }}>
              <th style={thStyle({ width: '38px', textAlign: 'center' })}>Sr.</th>
              <th style={thStyle({ textAlign: 'left' })}>Particulars / Description</th>
              <th style={thStyle({ width: '60px', textAlign: 'center' })}>Qty</th>
              <th style={thStyle({ width: '55px', textAlign: 'center' })}>Unit</th>
              <th style={thStyle({ width: '95px', textAlign: 'right' })}>Rate (₹)</th>
              <th style={thStyle({ width: '105px', textAlign: 'right' })}>Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '20px', textAlign: 'center', color: '#999', fontStyle: 'italic', fontSize: '12px', border: '1px solid #ccc' }}>
                  No items added
                </td>
              </tr>
            ) : (
              items.map((item, idx) => (
                <tr key={item.id} style={{ background: idx % 2 === 0 ? '#fff' : '#f8f8f8' }}>
                  <td style={tdStyle({ textAlign: 'center' })}>{idx + 1}</td>
                  <td style={tdStyle({})}>{item.description}</td>
                  <td style={tdStyle({ textAlign: 'center' })}>
                    {item.quantity % 1 === 0 ? item.quantity : item.quantity.toFixed(2)}
                  </td>
                  <td style={tdStyle({ textAlign: 'center' })}>{item.unit || '—'}</td>
                  <td style={tdStyle({ textAlign: 'right' })}>{formatIndianNumber(item.rate)}</td>
                  <td style={tdStyle({ textAlign: 'right', fontWeight: '600' })}>{formatIndianNumber(item.amount)}</td>
                </tr>
              ))
            )}

            {/* Empty rows - minimum 5 visible rows */}
            {items.length < 5 && Array.from({ length: Math.max(0, 5 - items.length) }).map((_, i) => (
              <tr key={`empty-${i}`} style={{ background: (items.length + i) % 2 === 0 ? '#fff' : '#f8f8f8' }}>
                <td style={{ ...tdStyle({}), height: '26px' }}>&nbsp;</td>
                <td style={tdStyle({})}>&nbsp;</td>
                <td style={tdStyle({})}>&nbsp;</td>
                <td style={tdStyle({})}>&nbsp;</td>
                <td style={tdStyle({})}>&nbsp;</td>
                <td style={tdStyle({})}>&nbsp;</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* ===== TOTALS SECTION ===== */}
        <div style={{ display: 'flex', border: '1px solid #1a1a1a', borderTop: 'none' }}>
          {/* Amount in Words */}
          <div style={{
            flex: 1, padding: '8px 12px', borderRight: '1px solid #1a1a1a',
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
          }}>
            <div style={{ fontSize: '10.5px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '3px', color: '#666', letterSpacing: '0.5px' }}>
              Amount in Words:
            </div>
            <div style={{ fontSize: '12px', fontStyle: 'italic', fontWeight: '600', lineHeight: '1.5', color: '#1a1a1a' }}>
              {amountToWords(totals.grandTotal)}
            </div>
          </div>

          {/* Totals */}
          <div style={{ minWidth: '250px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr style={{ borderBottom: '1px solid #e0e0e0' }}>
                  <td style={totalRowTd({ left: true })}>Subtotal</td>
                  <td style={totalRowTd({ left: false })}>{formatIndianNumber(totals.subtotal)}</td>
                </tr>
                {hasDiscount && (
                  <tr style={{ borderBottom: '1px solid #e0e0e0' }}>
                    <td style={totalRowTd({ left: true })}>
                      Discount {discount.type === 'percentage' ? `(${discount.value}%)` : '(Fixed)'}
                    </td>
                    <td style={{ ...totalRowTd({ left: false }), color: '#c00' }}>
                      − {formatIndianNumber(totals.discountAmount)}
                    </td>
                  </tr>
                )}
                {showSubsection && (
                  <tr style={{ borderBottom: '1px solid #e0e0e0' }}>
                    <td style={totalRowTd({ left: true })}>Taxable Amount</td>
                    <td style={totalRowTd({ left: false })}>{formatIndianNumber(totals.taxableAmount)}</td>
                  </tr>
                )}
                {hasTax && tax.cgst > 0 && (
                  <tr style={{ borderBottom: '1px solid #e0e0e0' }}>
                    <td style={totalRowTd({ left: true })}>CGST ({tax.cgst}%)</td>
                    <td style={totalRowTd({ left: false })}>{formatIndianNumber(totals.cgstAmount)}</td>
                  </tr>
                )}
                {hasTax && tax.sgst > 0 && (
                  <tr style={{ borderBottom: '1px solid #e0e0e0' }}>
                    <td style={totalRowTd({ left: true })}>SGST ({tax.sgst}%)</td>
                    <td style={totalRowTd({ left: false })}>{formatIndianNumber(totals.sgstAmount)}</td>
                  </tr>
                )}
                {hasTax && tax.igst > 0 && (
                  <tr style={{ borderBottom: '1px solid #e0e0e0' }}>
                    <td style={totalRowTd({ left: true })}>IGST ({tax.igst}%)</td>
                    <td style={totalRowTd({ left: false })}>{formatIndianNumber(totals.igstAmount)}</td>
                  </tr>
                )}
                <tr style={{ background: '#2c2c2c', color: '#fff' }}>
                  <td style={{ padding: '8px 10px', fontSize: '13px', fontWeight: 'bold', fontFamily: "'Times New Roman', serif" }}>
                    Grand Total
                  </td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', fontSize: '13px', fontWeight: 'bold', fontFamily: "'Times New Roman', serif" }}>
                    {formatAmt(totals.grandTotal)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ===== NOTES ===== */}
        {invoice.notes && (
          <div style={{ border: '1px solid #1a1a1a', borderTop: 'none', padding: '7px 12px' }}>
            <span style={{ fontSize: '10.5px', fontWeight: 'bold', textTransform: 'uppercase', color: '#666' }}>
              Notes: &nbsp;
            </span>
            <span style={{ fontSize: '12px', lineHeight: '1.4' }}>{invoice.notes}</span>
          </div>
        )}

        {/* ===== BANK + SIGNATURE ===== */}
        {(hasBank || hasSignature) && (
          <div style={{ display: 'flex', border: '1px solid #1a1a1a', borderTop: 'none' }}>
            {/* Bank Details */}
            {hasBank && (
              <div style={{ flex: 1, padding: '8px 12px', borderRight: hasSignature ? '1px solid #1a1a1a' : 'none' }}>
                <div style={{
                  fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase',
                  letterSpacing: '0.8px', borderBottom: '1px solid #888',
                  paddingBottom: '3px', marginBottom: '6px', color: '#333',
                }}>
                  Bank Details
                </div>
                <table style={{ fontSize: '11.5px', borderCollapse: 'collapse', width: '100%' }}>
                  <tbody>
                    {bank.bankName && (
                      <tr>
                        <td style={{ padding: '2px 0', color: '#666', whiteSpace: 'nowrap', paddingRight: '10px', width: '120px' }}>Bank Name</td>
                        <td style={{ padding: '2px 0' }}>: <strong>{bank.bankName}</strong></td>
                      </tr>
                    )}
                    {bank.accountHolderName && (
                      <tr>
                        <td style={{ padding: '2px 0', color: '#666', whiteSpace: 'nowrap', paddingRight: '10px' }}>Account Name</td>
                        <td style={{ padding: '2px 0' }}>: <strong>{bank.accountHolderName}</strong></td>
                      </tr>
                    )}
                    {bank.accountNumber && (
                      <tr>
                        <td style={{ padding: '2px 0', color: '#666', whiteSpace: 'nowrap', paddingRight: '10px' }}>Account No.</td>
                        <td style={{ padding: '2px 0' }}>: <strong>{bank.accountNumber}</strong></td>
                      </tr>
                    )}
                    {bank.branch && (
                      <tr>
                        <td style={{ padding: '2px 0', color: '#666', whiteSpace: 'nowrap', paddingRight: '10px' }}>Branch</td>
                        <td style={{ padding: '2px 0' }}>: <strong>{bank.branch}</strong></td>
                      </tr>
                    )}
                    {bank.ifscCode && (
                      <tr>
                        <td style={{ padding: '2px 0', color: '#666', whiteSpace: 'nowrap', paddingRight: '10px' }}>IFSC Code</td>
                        <td style={{ padding: '2px 0' }}>: <strong>{bank.ifscCode}</strong></td>
                      </tr>
                    )}
                    {bank.upiId && (
                      <tr>
                        <td style={{ padding: '2px 0', color: '#666', whiteSpace: 'nowrap', paddingRight: '10px' }}>UPI ID</td>
                        <td style={{ padding: '2px 0' }}>: <strong>{bank.upiId}</strong></td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Signature */}
            {hasSignature && (
              <div style={{
                minWidth: '200px',
                padding: '8px 16px',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'flex-end',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '11.5px', marginBottom: '6px', color: '#444' }}>
                  For <strong>{business.name || 'Business Name'}</strong>
                </div>
                {signature.image ? (
                  <img
                    src={signature.image}
                    alt="Signature"
                    style={{ maxHeight: '55px', maxWidth: '170px', objectFit: 'contain', marginBottom: '6px' }}
                  />
                ) : (
                  <div style={{ height: '45px', width: '140px', borderBottom: '1px solid #999', marginBottom: '6px' }} />
                )}
                <div style={{
                  fontSize: '11.5px', fontWeight: 'bold',
                  borderTop: '1px solid #555', paddingTop: '4px', width: '100%',
                }}>
                  {signature.authorizedName || 'Authorized Signatory'}
                </div>
                {signature.designation && (
                  <div style={{ fontSize: '10.5px', color: '#666', marginTop: '1px' }}>
                    {signature.designation}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ===== FOOTER ===== */}
        <div style={{
          marginTop: '10px', paddingTop: '6px',
          borderTop: '1px solid #bbb', textAlign: 'center',
          fontSize: '10.5px', color: '#777', fontStyle: 'italic',
        }}>
          This is a computer generated invoice. Thank you for your business!
        </div>
      </div>
    );
  }
);

InvoicePreview.displayName = 'InvoicePreview';

// Helper style functions
function thStyle(extra: React.CSSProperties = {}): React.CSSProperties {
  return {
    padding: '7px 8px',
    fontSize: '11.5px',
    fontWeight: 'bold',
    fontFamily: "'Times New Roman', serif",
    border: '1px solid #555',
    letterSpacing: '0.3px',
    ...extra,
  };
}

function tdStyle(extra: React.CSSProperties = {}): React.CSSProperties {
  return {
    padding: '5.5px 8px',
    fontSize: '12px',
    fontFamily: "'Times New Roman', serif",
    border: '1px solid #ccc',
    verticalAlign: 'top',
    ...extra,
  };
}

function totalRowTd({ left }: { left: boolean }): React.CSSProperties {
  return {
    padding: '5px 10px',
    fontSize: '12px',
    fontFamily: "'Times New Roman', serif",
    color: left ? '#444' : '#1a1a1a',
    textAlign: left ? 'left' : 'right',
    whiteSpace: 'nowrap',
  };
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

export default InvoicePreview;
