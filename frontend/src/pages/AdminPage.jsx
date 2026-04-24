import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Users, Key, Gift, DollarSign, RefreshCw, Shield, ShieldOff,
  Monitor, Copy, Search, TrendingUp, UserCheck, UserX, Trash2
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AdminPage() {
  const [tab, setTab] = useState("overview");
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [licenses, setLicenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userSearch, setUserSearch] = useState("");
  const [licenseSearch, setLicenseSearch] = useState("");
  const [giftEmail, setGiftEmail] = useState("");
  const [giftNote, setGiftNote] = useState("");
  const [giftLoading, setGiftLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [generatedGift, setGeneratedGift] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [s, u, l] = await Promise.all([
        axios.get(`${API}/admin/stats`, { withCredentials: true }),
        axios.get(`${API}/admin/users`, { withCredentials: true }),
        axios.get(`${API}/admin/licenses`, { withCredentials: true }),
      ]);
      setStats(s.data);
      setUsers(u.data.users);
      setLicenses(l.data.licenses);
    } catch (err) {
      toast.error("Failed to load admin data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const doAction = async (endpoint, body, successMsg) => {
    try {
      await axios.post(`${API}/admin/licenses/${endpoint}`, body, { withCredentials: true });
      toast.success(successMsg);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Action failed");
    }
    setConfirmAction(null);
  };

  const generateGiftKey = async () => {
    if (!giftEmail.trim()) { toast.error("Enter an email address"); return; }
    setGiftLoading(true);
    try {
      const res = await axios.post(`${API}/admin/licenses/gift`, {
        email: giftEmail.trim(), note: giftNote.trim()
      }, { withCredentials: true });
      toast.success(`Gift key generated: ${res.data.license_key}`);
      setGeneratedGift({ key: res.data.license_key, email: giftEmail.trim(), note: giftNote.trim() });
      setGiftEmail("");
      setGiftNote("");
      fetchAll();
    } catch (err) {
      toast.error("Failed to generate gift key");
    } finally {
      setGiftLoading(false);
    }
  };

  const filteredUsers = users.filter(u => {
    if (!userSearch) return true;
    const q = userSearch.toLowerCase();
    return u.email?.toLowerCase().includes(q) || u.name?.toLowerCase().includes(q);
  });

  const filteredLicenses = licenses.filter(l => {
    if (!licenseSearch) return true;
    const q = licenseSearch.toLowerCase();
    return l.license_key?.toLowerCase().includes(q) || l.email?.toLowerCase().includes(q);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6" data-testid="admin-page">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
          <Shield className="w-5 h-5 text-red-400" />
        </div>
        <div>
          <h1 className="text-2xl font-[Outfit] font-bold">Admin Panel</h1>
          <p className="text-sm text-muted-foreground">Manage users, licenses, and revenue</p>
        </div>
        <div className="ml-auto">
          <Button variant="outline" size="sm" onClick={fetchAll} data-testid="admin-refresh">
            <RefreshCw className="w-4 h-4 mr-1.5" /> Refresh
          </Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid grid-cols-4 w-full max-w-lg">
          <TabsTrigger value="overview" data-testid="admin-tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="users" data-testid="admin-tab-users">Users</TabsTrigger>
          <TabsTrigger value="licenses" data-testid="admin-tab-licenses">Licenses</TabsTrigger>
          <TabsTrigger value="gift" data-testid="admin-tab-gift">Gift Key</TabsTrigger>
        </TabsList>

        {/* ── Overview Tab ── */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard icon={Users} label="Total Users" value={stats?.total_users || 0} color="text-blue-400" />
            <StatCard icon={UserCheck} label="Pro Users" value={stats?.pro_users || 0} color="text-emerald-400" />
            <StatCard icon={UserX} label="Free Users" value={stats?.free_users || 0} color="text-amber-400" />
            <StatCard icon={DollarSign} label="Revenue" value={`$${((stats?.total_revenue || 0) / 100).toFixed(0)}`} color="text-green-400" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard icon={Key} label="Total Licenses" value={stats?.total_licenses || 0} color="text-purple-400" />
            <StatCard icon={Shield} label="Active Licenses" value={stats?.active_licenses || 0} color="text-cyan-400" />
            <StatCard icon={Gift} label="Gift Licenses" value={stats?.gift_licenses || 0} color="text-pink-400" />
            <StatCard icon={TrendingUp} label="Transactions" value={stats?.total_transactions || 0} color="text-orange-400" />
          </div>

          {stats?.recent_transactions?.length > 0 && (
            <Card>
              <CardHeader className="pb-2 pt-3 px-4">
                <CardTitle className="text-sm font-medium text-muted-foreground">Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3">
                <div className="space-y-2">
                  {stats.recent_transactions.map((t, i) => (
                    <div key={i} className="flex items-center justify-between text-sm p-2 rounded bg-secondary/40 border border-border/30">
                      <span className="text-muted-foreground">{t.user_id}</span>
                      <span className="font-medium text-green-400">${((t.amount || 0) / 100).toFixed(2)}</span>
                      <span className="text-xs text-muted-foreground">{t.created_at ? new Date(t.created_at).toLocaleDateString() : ''}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── Users Tab ── */}
        <TabsContent value="users" className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search users by name or email..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="pl-9"
              data-testid="admin-user-search"
            />
          </div>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-3 text-muted-foreground font-medium">User</th>
                      <th className="text-left p-3 text-muted-foreground font-medium">Tier</th>
                      <th className="text-left p-3 text-muted-foreground font-medium">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u, i) => (
                      <tr key={i} className="border-b border-border/30 hover:bg-secondary/30" data-testid={`admin-user-row-${i}`}>
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            {u.picture ? (
                              <img src={u.picture} alt="" className="w-8 h-8 rounded-full" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                                {(u.name || u.email || '?')[0].toUpperCase()}
                              </div>
                            )}
                            <div>
                              <p className="font-medium">{u.name || 'Unknown'}</p>
                              <p className="text-xs text-muted-foreground">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge variant={u.subscription_tier === 'pro' ? 'default' : 'secondary'}>
                            {u.subscription_tier === 'pro' ? 'Pro' : 'Free'}
                          </Badge>
                        </td>
                        <td className="p-3 text-muted-foreground">
                          {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                        </td>
                      </tr>
                    ))}
                    {filteredUsers.length === 0 && (
                      <tr><td colSpan={3} className="p-6 text-center text-muted-foreground">No users found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
          <p className="text-xs text-muted-foreground">{filteredUsers.length} of {users.length} users</p>
        </TabsContent>

        {/* ── Licenses Tab ── */}
        <TabsContent value="licenses" className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by key or email..."
              value={licenseSearch}
              onChange={(e) => setLicenseSearch(e.target.value)}
              className="pl-9"
              data-testid="admin-license-search"
            />
          </div>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-3 text-muted-foreground font-medium">License Key</th>
                      <th className="text-left p-3 text-muted-foreground font-medium">Email</th>
                      <th className="text-left p-3 text-muted-foreground font-medium">Status</th>
                      <th className="text-left p-3 text-muted-foreground font-medium">Machine</th>
                      <th className="text-left p-3 text-muted-foreground font-medium">Created</th>
                      <th className="text-right p-3 text-muted-foreground font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLicenses.map((l, i) => (
                      <tr key={i} className="border-b border-border/30 hover:bg-secondary/30" data-testid={`admin-license-row-${i}`}>
                        <td className="p-3">
                          <div className="flex items-center gap-1.5">
                            <code className="text-xs font-mono bg-secondary px-1.5 py-0.5 rounded">{l.license_key}</code>
                            <button
                              className="text-muted-foreground hover:text-foreground"
                              onClick={() => { navigator.clipboard?.writeText(l.license_key); toast.success('Copied'); }}
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                            {l.gift && <Badge variant="outline" className="text-[10px] h-4 px-1 text-pink-400 border-pink-400/30">Gift</Badge>}
                          </div>
                        </td>
                        <td className="p-3 text-muted-foreground text-xs">{l.email}</td>
                        <td className="p-3">
                          <Badge variant={l.is_active ? 'default' : 'destructive'} className="text-[10px]">
                            {l.is_active ? 'Active' : 'Revoked'}
                          </Badge>
                        </td>
                        <td className="p-3">
                          {l.activated_machine_id ? (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Monitor className="w-3 h-3" />
                              {l.activated_machine_id.substring(0, 12)}...
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground/50">Not activated</span>
                          )}
                        </td>
                        <td className="p-3 text-xs text-muted-foreground">
                          {l.created_at ? new Date(l.created_at).toLocaleDateString() : '—'}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center gap-1 justify-end">
                            {l.is_active ? (
                              <Button
                                variant="ghost" size="sm" className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                                onClick={() => setConfirmAction({ type: 'revoke', key: l.license_key })}
                                data-testid={`revoke-${i}`}
                              >
                                <ShieldOff className="w-3 h-3 mr-1" /> Revoke
                              </Button>
                            ) : (
                              <Button
                                variant="ghost" size="sm" className="h-7 px-2 text-xs text-emerald-400"
                                onClick={() => setConfirmAction({ type: 'reactivate', key: l.license_key })}
                                data-testid={`reactivate-${i}`}
                              >
                                <Shield className="w-3 h-3 mr-1" /> Reactivate
                              </Button>
                            )}
                            {l.activated_machine_id && (
                              <Button
                                variant="ghost" size="sm" className="h-7 px-2 text-xs"
                                onClick={() => setConfirmAction({ type: 'reset-machine', key: l.license_key })}
                                data-testid={`reset-machine-${i}`}
                              >
                                <Monitor className="w-3 h-3 mr-1" /> Reset Machine
                              </Button>
                            )}
                            <Button
                              variant="ghost" size="sm" className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                              onClick={() => setConfirmAction({ type: 'delete', key: l.license_key })}
                              data-testid={`delete-license-${i}`}
                            >
                              <Trash2 className="w-3 h-3 mr-1" /> Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredLicenses.length === 0 && (
                      <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No licenses found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
          <p className="text-xs text-muted-foreground">{filteredLicenses.length} of {licenses.length} licenses</p>
        </TabsContent>

        {/* ── Gift Key Tab ── */}
        <TabsContent value="gift" className="space-y-4">
          <Card>
            <CardHeader className="pb-2 pt-4 px-5">
              <CardTitle className="text-base font-[Outfit] flex items-center gap-2">
                <Gift className="w-5 h-5 text-pink-400" />
                Generate Gift License Key
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5 space-y-4">
              <p className="text-sm text-muted-foreground">
                Create a free Pro license key for someone. The key is single-use and machine-locked on activation.
              </p>
              <div className="space-y-3 max-w-md">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Recipient Email</label>
                  <Input
                    placeholder="user@example.com"
                    value={giftEmail}
                    onChange={(e) => setGiftEmail(e.target.value)}
                    data-testid="gift-email-input"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Note (optional)</label>
                  <Input
                    placeholder="e.g. Beta tester, reviewer..."
                    value={giftNote}
                    onChange={(e) => setGiftNote(e.target.value)}
                    data-testid="gift-note-input"
                  />
                </div>
                <Button onClick={generateGiftKey} disabled={giftLoading} data-testid="gift-generate-btn">
                  {giftLoading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Gift className="w-4 h-4 mr-2" />}
                  Generate & Copy Key
                </Button>
              </div>

              {generatedGift && (
                <GiftEmailTemplate gift={generatedGift} onClose={() => setGeneratedGift(null)} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!confirmAction} onOpenChange={(open) => { if (!open) setConfirmAction(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.type === 'revoke' && 'Revoke License?'}
              {confirmAction?.type === 'reactivate' && 'Reactivate License?'}
              {confirmAction?.type === 'reset-machine' && 'Reset Machine Lock?'}
              {confirmAction?.type === 'delete' && 'Permanently Delete License?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.type === 'revoke' && `This will deactivate license ${confirmAction?.key}. The user will lose Pro access.`}
              {confirmAction?.type === 'reactivate' && `This will reactivate license ${confirmAction?.key}.`}
              {confirmAction?.type === 'reset-machine' && `This will clear the machine lock on ${confirmAction?.key}, allowing it to be activated on a different machine.`}
              {confirmAction?.type === 'delete' && `This will permanently remove license ${confirmAction?.key} from the database. This cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (!confirmAction) return;
              doAction(confirmAction.type, { license_key: confirmAction.key },
                confirmAction.type === 'revoke' ? 'License revoked' :
                confirmAction.type === 'reactivate' ? 'License reactivated' :
                confirmAction.type === 'delete' ? 'License permanently deleted' :
                'Machine lock cleared'
              );
            }}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`w-9 h-9 rounded-lg bg-secondary flex items-center justify-center ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-bold font-[Outfit]">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function GiftEmailTemplate({ gift, onClose }) {
  const emailText = `Subject: You've been upgraded to Obsidian Cinema Pro!

Hey there,

Great news — the free tier has been expanded to 500 movies with release 1.6.2 but...

You've just been gifted a complimentary Obsidian Cinema PRO license! Consider this your all-access pass to the full cinematic experience.

Your Pro License Key:
${gift.key}

Here's how to activate it:

If you haven't grabbed the latest Obsidian Cinema yet, download v1.6.2 here:
https://www.obsidiancinema.com

1. Download and Install the newest version of Obsidian Cinema
2. Open Obsidian Cinema
3. Go to the Activation page (or Settings > License)
4. Paste the key above and hit Activate

What you're unlocking:
- Unlimited movies in your library (no more caps)
- Unlimited collections to organize however you like
- AI-powered movie recommendations tailored to your taste
- Priority access to every new feature we ship

This key is yours alone — it locks to your machine on first activation, so no one else can use it.

Welcome to the Pro side. Enjoy the show.

Cheers,
The Obsidian Cinema Team`;

  const copyEmail = () => {
    navigator.clipboard?.writeText(emailText);
    toast.success("Email text copied to clipboard");
  };

  const copyKey = () => {
    navigator.clipboard?.writeText(gift.key);
    toast.success("License key copied");
  };

  return (
    <div className="mt-4 p-4 rounded-lg border border-primary/30 bg-primary/5 space-y-3" data-testid="gift-email-template">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Gift className="w-4 h-4 text-pink-400" />
          Gift key generated for {gift.email}
        </h3>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xs">Dismiss</button>
      </div>

      <div className="flex items-center gap-2 p-2 rounded bg-secondary border border-border">
        <code className="text-sm font-mono font-bold text-primary flex-1">{gift.key}</code>
        <Button variant="ghost" size="sm" className="h-7 px-2" onClick={copyKey}>
          <Copy className="w-3.5 h-3.5" />
        </Button>
      </div>

      <div className="relative">
        <pre className="text-xs text-muted-foreground whitespace-pre-wrap bg-secondary/60 border border-border/50 rounded-lg p-4 max-h-64 overflow-y-auto font-sans leading-relaxed">
          {emailText}
        </pre>
      </div>

      <div className="flex gap-2">
        <Button onClick={copyEmail} variant="outline" size="sm" data-testid="copy-gift-email-btn">
          <Copy className="w-4 h-4 mr-1.5" /> Copy Email Text
        </Button>
        <Button
          variant="outline" size="sm"
          onClick={() => {
            const subject = encodeURIComponent("You've been upgraded to Obsidian Cinema Pro!");
            const body = encodeURIComponent(emailText.replace(/^Subject:.*\n\n/, ''));
            window.open(`mailto:${gift.email}?subject=${subject}&body=${body}`, '_blank');
          }}
          data-testid="open-mailto-btn"
        >
          Open in Email Client (obsidiancinemaplus@gmail.com)
        </Button>
      </div>
    </div>
  );
}
