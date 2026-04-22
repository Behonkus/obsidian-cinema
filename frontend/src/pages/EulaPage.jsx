import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Shield } from "lucide-react";

const EULA_TEXT = `END USER LICENSE AGREEMENT (EULA)
Obsidian Cinema — Desktop Application

Last Updated: April 2026

PLEASE READ THIS AGREEMENT CAREFULLY BEFORE USING OBSIDIAN CINEMA.

By installing, copying, or otherwise using Obsidian Cinema ("the Software"), you agree to be bound by the terms of this End User License Agreement ("Agreement"). If you do not agree to these terms, do not install or use the Software.

1. LICENSE GRANT

The developer of Obsidian Cinema ("Licensor") grants you a limited, non-exclusive, non-transferable, revocable license to install and use the Software on a single personal computer for personal, non-commercial use, subject to the terms of this Agreement.

Pro License holders receive an expanded license that removes usage limitations (such as movie and collection caps). Each Pro License key is locked to a single machine upon activation and is non-transferable.

2. RESTRICTIONS

You may not:
  (a) Copy, modify, distribute, sell, lease, sublicense, or otherwise transfer the Software or any portion thereof;
  (b) Reverse engineer, decompile, disassemble, or attempt to derive the source code of the Software, except as permitted by applicable law;
  (c) Remove, alter, or obscure any copyright, trademark, or other proprietary notices contained in the Software;
  (d) Use the Software for any unlawful purpose or in violation of any applicable laws or regulations;
  (e) Share, redistribute, or publicly post Pro License keys.

3. INTELLECTUAL PROPERTY

The Software, including all code, graphics, user interface designs, and documentation, is the intellectual property of the Licensor and is protected by copyright and other intellectual property laws. This Agreement does not grant you any ownership rights in the Software.

4. THIRD-PARTY SERVICES

The Software integrates with third-party services including but not limited to The Movie Database (TMDB) for metadata retrieval, OpenAI for AI-powered recommendations, and Stripe for payment processing. Your use of these services is subject to their respective terms and privacy policies. The Licensor is not responsible for the availability, accuracy, or conduct of any third-party service.

5. DATA AND PRIVACY

  (a) Local Data: The Software stores your movie library data, preferences, and settings locally on your device. This data is not transmitted to external servers unless you explicitly use cloud-based features.
  (b) API Keys: Any third-party API keys you enter (e.g., TMDB) are stored locally on your device and are not shared with the Licensor or any third party.
  (c) Account Data: If you create an account via the web portal, basic account information (email, name) is stored securely for authentication and license management purposes.
  (d) Payment Data: Payment information is processed directly by Stripe. The Licensor does not store credit card numbers or sensitive payment details.

6. DISCLAIMER OF WARRANTIES

THE SOFTWARE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. THE LICENSOR DOES NOT WARRANT THAT THE SOFTWARE WILL BE UNINTERRUPTED, ERROR-FREE, OR FREE OF HARMFUL COMPONENTS.

7. LIMITATION OF LIABILITY

TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL THE LICENSOR BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF DATA, LOSS OF PROFITS, OR BUSINESS INTERRUPTION, ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF OR INABILITY TO USE THE SOFTWARE, EVEN IF THE LICENSOR HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.

THE LICENSOR'S TOTAL AGGREGATE LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID FOR THE SOFTWARE LICENSE, IF ANY.

8. MEDIA FILES

The Software is designed to organize and catalog media files already present on your local system or accessible network drives. The Licensor does not endorse, facilitate, or condone the acquisition of media through unauthorized means. You are solely responsible for ensuring that you have the legal right to possess and use any media files managed by the Software.

9. UPDATES AND MODIFICATIONS

The Licensor may release updates, patches, or new versions of the Software from time to time. This Agreement applies to all such updates unless a separate agreement accompanies them. The Licensor reserves the right to modify, suspend, or discontinue any aspect of the Software at any time without prior notice.

10. TERMINATION

This Agreement is effective until terminated. Your rights under this Agreement will terminate automatically without notice if you fail to comply with any of its terms. Upon termination, you must cease all use of the Software and destroy all copies in your possession.

The Licensor reserves the right to revoke any License key at its sole discretion.

11. GOVERNING LAW

This Agreement shall be governed by and construed in accordance with the laws of the United States, without regard to its conflict of law principles.

12. ENTIRE AGREEMENT

This Agreement constitutes the entire agreement between you and the Licensor regarding the Software and supersedes all prior agreements and understandings, whether written or oral.

13. CONTACT

For questions regarding this Agreement, please visit:
https://www.obsidiancinema.com

By clicking "I Accept" below, you acknowledge that you have read, understood, and agree to be bound by the terms of this Agreement.`;

export default function EulaPage({ appVersion, onAccept }) {
  const [scrolledToBottom, setScrolledToBottom] = useState(false);

  const handleScroll = (e) => {
    const el = e.target;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 40) {
      setScrolledToBottom(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4" data-testid="eula-page">
      <Card className="w-full max-w-2xl">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-[Outfit] font-bold">License Agreement</h1>
              <p className="text-xs text-muted-foreground">Obsidian Cinema v{appVersion}</p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Please read and accept the End User License Agreement to continue.
          </p>

          <ScrollArea
            className="h-80 rounded-lg border border-border bg-secondary/30 p-4"
            onScrollCapture={handleScroll}
            data-testid="eula-scroll-area"
          >
            <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-sans leading-relaxed">
              {EULA_TEXT}
            </pre>
          </ScrollArea>

          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-muted-foreground">
              {scrolledToBottom ? "You've reviewed the agreement" : "Scroll to the bottom to continue"}
            </p>
            <Button
              onClick={onAccept}
              disabled={!scrolledToBottom}
              data-testid="eula-accept-btn"
            >
              I Accept
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
