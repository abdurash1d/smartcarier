/**
 * =============================================================================
 * UNIVERSITIES MODULE - AI University Application Assistant
 * =============================================================================
 *
 * Features:
 * - AI University Finder based on profile
 * - Grant/Scholarship search
 * - AI Motivation Letter Generator
 * - Application tracking
 * - IELTS/TOEFL score matching
 */

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap,
  Search,
  Filter,
  MapPin,
  DollarSign,
  Star,
  Award,
  Globe,
  BookOpen,
  FileText,
  Sparkles,
  ArrowRight,
  Heart,
  ExternalLink,
  Calendar,
  Clock,
  CheckCircle,
  Users,
  TrendingUp,
  Plane,
  Loader2,
  Wand2,
  ChevronDown,
  Building2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { universityApi, scholarshipApi, universityApplicationApi, motivationLetterApi } from "@/lib/api";
import { University, Scholarship, UniversityApplication, UniversityAISearchRequest } from "@/types/api";
import { getErrorMessage } from "@/lib/api";

// =============================================================================
// MOCK DATA
// =============================================================================

const mockUniversities = [
  {
    id: "1",
    name: "Massachusetts Institute of Technology (MIT)",
    country: "AQSh",
    city: "Cambridge, MA",
    ranking: 1,
    logo: "🏛️",
    matchScore: 94,
    tuition: "$58,240",
    scholarship: "To'liq grant mavjud",
    deadline: "2024-01-01",
    programs: ["Computer Science", "Engineering", "Mathematics"],
    requirements: {
      ielts: 7.0,
      toefl: 100,
      gpa: 3.8,
    },
    acceptanceRate: "4%",
    description: "Dunyodagi eng nufuzli texnik universitetlardan biri",
  },
  {
    id: "2",
    name: "Stanford University",
    country: "AQSh",
    city: "Stanford, CA",
    ranking: 2,
    logo: "🏛️",
    matchScore: 89,
    tuition: "$56,169",
    scholarship: "Ehtiyojga asoslangan yordam",
    deadline: "2024-01-02",
    programs: ["Computer Science", "Business", "Law"],
    requirements: {
      ielts: 7.0,
      toefl: 100,
      gpa: 3.7,
    },
    acceptanceRate: "4.3%",
    description: "Silicon Valley'dagi yetakchi tadqiqot universiteti",
  },
  {
    id: "3",
    name: "University of Cambridge",
    country: "Buyuk Britaniya",
    city: "Cambridge",
    ranking: 3,
    logo: "🏛️",
    matchScore: 87,
    tuition: "£24,507",
    scholarship: "Gates Cambridge Scholarship",
    deadline: "2024-01-15",
    programs: ["Engineering", "Natural Sciences", "Computer Science"],
    requirements: {
      ielts: 7.5,
      toefl: 110,
      gpa: 3.9,
    },
    acceptanceRate: "21%",
    description: "Dunyodagi eng qadimiy va nufuzli universitetlardan biri",
  },
  {
    id: "4",
    name: "Technical University of Munich",
    country: "Germaniya",
    city: "Munich",
    ranking: 50,
    logo: "🏛️",
    matchScore: 92,
    tuition: "Bepul",
    scholarship: "DAAD Scholarship",
    deadline: "2024-07-15",
    programs: ["Computer Science", "Engineering", "Physics"],
    requirements: {
      ielts: 6.5,
      toefl: 88,
      gpa: 3.5,
    },
    acceptanceRate: "8%",
    description: "Yevropadagi eng yaxshi texnik universitetlardan biri",
  },
  {
    id: "5",
    name: "KAIST",
    country: "Janubiy Koreya",
    city: "Daejeon",
    ranking: 41,
    logo: "🏛️",
    matchScore: 95,
    tuition: "Bepul (grant bilan)",
    scholarship: "To'liq grant + stipendiya",
    deadline: "2024-03-15",
    programs: ["Computer Science", "AI", "Robotics"],
    requirements: {
      ielts: 6.5,
      toefl: 83,
      gpa: 3.4,
    },
    acceptanceRate: "15%",
    description: "Osiyo yetakchi texnik universiteti, to'liq grantlar mavjud",
  },
];

const mockScholarships = [
  {
    id: "1",
    name: "Chevening Scholarship",
    country: "Buyuk Britaniya",
    amount: "To'liq moliyalashtirish",
    deadline: "2024-11-01",
    coverage: ["Tuition", "Living expenses", "Travel"],
    requirements: ["2 yil ish tajribasi", "IELTS 6.5+"],
  },
  {
    id: "2",
    name: "DAAD Scholarship",
    country: "Germaniya",
    amount: "€861/oy + tuition",
    deadline: "2024-10-15",
    coverage: ["Tuition", "Monthly stipend", "Health insurance"],
    requirements: ["Bachelor's degree", "German/English proficiency"],
  },
  {
    id: "3",
    name: "Korean Government Scholarship (KGSP)",
    country: "Janubiy Koreya",
    amount: "To'liq moliyalashtirish",
    deadline: "2024-03-01",
    coverage: ["Tuition", "Stipend", "Housing", "Korean language course"],
    requirements: ["Under 25 years old", "GPA 80%+"],
  },
  {
    id: "4",
    name: "Fulbright Program",
    country: "AQSh",
    amount: "To'liq moliyalashtirish",
    deadline: "2024-10-15",
    coverage: ["Tuition", "Living expenses", "Travel", "Health insurance"],
    requirements: ["Bachelor's degree", "Strong academic record"],
  },
];

const mockApplications = [
  {
    id: "1",
    university: "MIT",
    program: "MS Computer Science",
    status: "submitted",
    submittedDate: "2024-01-05",
    deadline: "2024-01-01",
    documents: { completed: 5, total: 5 },
  },
  {
    id: "2",
    university: "Stanford",
    program: "MS Computer Science",
    status: "in_progress",
    deadline: "2024-01-02",
    documents: { completed: 3, total: 5 },
  },
  {
    id: "3",
    university: "Cambridge",
    program: "MPhil Computer Science",
    status: "accepted",
    submittedDate: "2024-01-10",
    deadline: "2024-01-15",
    documents: { completed: 5, total: 5 },
  },
];

// =============================================================================
// COMPONENTS
// =============================================================================

const UniversityCard = ({
  university,
  onApply,
  onSave,
}: {
  university: University | typeof mockUniversities[0];
  onApply: () => void;
  onSave: () => void;
}) => {
  // Handle both mock and real data structures
  const name = university.name;
  const country = university.country;
  const city = university.city;
  const ranking = 'world_ranking' in university ? university.world_ranking : ('ranking' in university ? university.ranking : undefined);
  const logo = 'logo' in university ? (university as any).logo : '🏛️';
  const matchScore = 'matchScore' in university ? university.matchScore : undefined;
  const tuition = 'tuition' in university ? university.tuition : 
    ('tuition_min' in university && university.tuition_min) ? `$${university.tuition_min}` : 'N/A';
  const scholarship = 'scholarship' in university ? university.scholarship : 'Mavjud emas';
  const deadline = 'deadline' in university ? university.deadline : 
    ('application_deadline_fall' in university && university.application_deadline_fall) ? university.application_deadline_fall : undefined;
  const programs = 'programs' in university ? university.programs : [];
  const requirements = 'requirements' in university ? university.requirements : undefined;
  const acceptanceRate = 'acceptanceRate' in university ? university.acceptanceRate : 
    ('acceptance_rate' in university ? university.acceptance_rate : undefined);
  const description = university.description || '';

  return (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -4 }}
    className="group rounded-2xl border border-surface-200 bg-white p-6 shadow-sm transition-all hover:border-purple-200 hover:shadow-lg dark:border-surface-700 dark:bg-surface-800"
  >
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-2xl">
          {logo}
        </div>
        <div>
          <h3 className="font-display text-lg font-bold text-surface-900 dark:text-white">
            {name}
          </h3>
          <div className="mt-1 flex items-center gap-3 text-sm text-surface-500">
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {city}, {country}
            </span>
            {ranking && (
              <span className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                #{ranking}
              </span>
            )}
          </div>
        </div>
      </div>
      {matchScore && (
        <div className="text-right">
          <div className="flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-sm font-bold text-green-700">
            <Sparkles className="h-4 w-4" />
            {matchScore}% mos
          </div>
        </div>
      )}
    </div>

    {description && (
      <p className="mt-4 text-sm text-surface-600 dark:text-surface-400">
        {description}
      </p>
    )}

    {programs && programs.length > 0 && (
      <div className="mt-4 flex flex-wrap gap-2">
        {programs.slice(0, 3).map((program, idx) => (
          <Badge key={idx} variant="secondary" className="text-xs">
            {program}
          </Badge>
        ))}
      </div>
    )}

    <div className="mt-4 grid grid-cols-3 gap-4 rounded-xl bg-surface-50 p-4 dark:bg-surface-700/50">
      <div>
        <p className="text-xs text-surface-500">Tuition</p>
        <p className="font-semibold text-surface-900 dark:text-white">
          {tuition}
        </p>
      </div>
      <div>
        <p className="text-xs text-surface-500">Grant</p>
        <p className="font-semibold text-green-600">{scholarship}</p>
      </div>
      <div>
        <p className="text-xs text-surface-500">Muddat</p>
        {deadline && (
          <p className="font-semibold text-surface-900 dark:text-white">
            {new Date(deadline).toLocaleDateString("uz-UZ")}
          </p>
        )}
      </div>
    </div>

    <div className="mt-4 flex items-center justify-between">
      {requirements && (
        <div className="text-sm text-surface-500">
          <span className="font-medium text-surface-900 dark:text-white">Talablar:</span>{" "}
          {requirements.ielts && `IELTS ${requirements.ielts}+`}
          {requirements.ielts && requirements.gpa && " | "}
          {requirements.gpa && `GPA ${requirements.gpa}+`}
        </div>
      )}
      <div className="flex gap-2">
        <Button variant="ghost" size="sm" onClick={onSave}>
          <Heart className="h-4 w-4" />
        </Button>
        <Button size="sm" onClick={onApply}>
          Ariza berish
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  </motion.div>
  );
};

const ScholarshipCard = ({ scholarship }: { scholarship: Scholarship | typeof mockScholarships[0] }) => {
  // Handle both mock and real data structures
  const name = scholarship.name;
  const country = scholarship.country;
  const amount = 'amount' in scholarship ? scholarship.amount : 
    ('amount_info' in scholarship && scholarship.amount_info) ? 
      (scholarship.amount_info.type === 'full_tuition' ? 'To\'liq moliyalashtirish' : 
       scholarship.amount_info.amount ? `$${scholarship.amount_info.amount}` : 'N/A') : 'N/A';
  const deadline = 'deadline' in scholarship ? scholarship.deadline : 
    ('application_deadline' in scholarship ? scholarship.application_deadline : '');
  const coverage = 'coverage' in scholarship ? scholarship.coverage : [];
  const requirements = 'requirements' in scholarship ? scholarship.requirements : [];

  return (
  <Card className="transition-all hover:border-purple-200 hover:shadow-lg">
    <CardContent className="pt-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-display text-lg font-bold text-surface-900 dark:text-white">
            {scholarship.name}
          </h3>
          <p className="mt-1 flex items-center gap-1 text-sm text-surface-500">
            <Globe className="h-4 w-4" />
            {scholarship.country}
          </p>
        </div>
        <Badge variant="success" className="bg-green-100 text-green-700">
          {amount}
        </Badge>
      </div>

      {coverage && coverage.length > 0 && (
        <div className="mt-4">
          <p className="text-xs text-surface-500 mb-2">Qoplanadi:</p>
          <div className="flex flex-wrap gap-2">
            {coverage.map((item, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                <CheckCircle className="mr-1 h-3 w-3" />
                {item}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {deadline && (
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-1 text-sm text-amber-600">
            <Clock className="h-4 w-4" />
            Muddat: {new Date(deadline).toLocaleDateString("uz-UZ")}
          </div>
        <Button size="sm" variant="outline">
          Batafsil
          <ExternalLink className="ml-2 h-4 w-4" />
        </Button>
        </div>
      )}
    </CardContent>
  </Card>
  );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function UniversitiesPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("universities");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("all");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showMotivationModal, setShowMotivationModal] = useState(false);
  
  // State for real data
  const [universities, setUniversities] = useState<University[]>([]);
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [applications, setApplications] = useState<UniversityApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    universitiesCount: 0,
    scholarshipsCount: 0,
    applicationsCount: 0,
    avgMatchScore: 0,
  });

  // Load universities
  useEffect(() => {
    loadUniversities();
    loadScholarships();
    loadApplications();
  }, []);

  const loadUniversities = async () => {
    try {
      setLoading(true);
      const response = await universityApi.search({
        search: searchQuery || undefined,
        country: selectedCountry !== "all" ? selectedCountry : undefined,
        page: 1,
        limit: 50,
      });
      setUniversities(response.data.items || []);
      setStats((prev) => ({ ...prev, universitiesCount: response.data.total || 0 }));
    } catch (error) {
      console.error("Failed to load universities:", error);
      toast.error(getErrorMessage(error));
      // Fallback to mock data on error (with type casting)
      setUniversities(mockUniversities as any);
    } finally {
      setLoading(false);
    }
  };

  const loadScholarships = async () => {
    try {
      const response = await scholarshipApi.list({ page: 1, limit: 50 });
      setScholarships(response.data.items || []);
      setStats((prev) => ({ ...prev, scholarshipsCount: response.data.total || 0 }));
    } catch (error) {
      console.error("Failed to load scholarships:", error);
      // Fallback to mock data (with type casting)
      setScholarships(mockScholarships as any);
    }
  };

  const loadApplications = async () => {
    try {
      const response = await universityApplicationApi.list({ page: 1, limit: 50 });
      setApplications(response.data.items || []);
      setStats((prev) => ({ ...prev, applicationsCount: response.data.total || 0 }));
    } catch (error) {
      console.error("Failed to load applications:", error);
      // Fallback to mock data (with type casting)
      setApplications(mockApplications as any);
    }
  };

  // AI Find Universities
  const handleAISearch = async () => {
    setIsGenerating(true);
    try {
      const request: UniversityAISearchRequest = {
        student_profile: {
          // TODO: Get from user profile
          gpa: 3.5,
          ielts: 7.0,
        },
        preferred_countries: selectedCountry !== "all" ? [selectedCountry] : undefined,
        max_results: 10,
      };
      
      const response = await universityApi.aiSearch(request);
      setUniversities(response.data.items || []);
      toast.success("AI sizning profilingizga mos universitetlarni topdi!");
    } catch (error) {
      console.error("AI search failed:", error);
      toast.error(getErrorMessage(error));
    } finally {
      setIsGenerating(false);
    }
  };

  // Filter universities (client-side filtering for now)
  const filteredUniversities = universities.filter((uni) => {
    const matchesSearch = !searchQuery || uni.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCountry = selectedCountry === "all" || uni.country === selectedCountry;
    return matchesSearch && matchesCountry;
  });

  // Update when search/country changes
  useEffect(() => {
    if (searchQuery || selectedCountry !== "all") {
      loadUniversities();
    }
  }, [searchQuery, selectedCountry]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-surface-900 dark:text-white">
            🎓 Universitetlarga topshirish
          </h1>
          <p className="mt-1 text-surface-500">
            AI yordamida ideal universitetingizni toping va ariza bering
          </p>
        </div>
        <Button
          onClick={handleAISearch}
          disabled={isGenerating}
          className="bg-gradient-to-r from-purple-500 to-indigo-600"
        >
          {isGenerating ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" />
          )}
          AI bilan qidirish
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-surface-900 dark:text-white">
                {loading ? "..." : stats.universitiesCount || universities.length}
              </p>
              <p className="text-sm text-surface-500">Mos universitetlar</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-600">
              <Award className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-surface-900 dark:text-white">
                {stats.scholarshipsCount || scholarships.length}
              </p>
              <p className="text-sm text-surface-500">Mavjud grantlar</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-surface-900 dark:text-white">
                {stats.applicationsCount || applications.length}
              </p>
              <p className="text-sm text-surface-500">Mening arizalarim</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-surface-900 dark:text-white">
                {stats.avgMatchScore || 94}%
              </p>
              <p className="text-sm text-surface-500">O'rtacha moslik</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 lg:w-auto">
          <TabsTrigger value="universities" className="gap-2">
            <GraduationCap className="h-4 w-4" />
            <span className="hidden sm:inline">Universitetlar</span>
          </TabsTrigger>
          <TabsTrigger value="scholarships" className="gap-2">
            <Award className="h-4 w-4" />
            <span className="hidden sm:inline">Grantlar</span>
          </TabsTrigger>
          <TabsTrigger value="applications" className="gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Arizalarim</span>
          </TabsTrigger>
          <TabsTrigger value="tools" className="gap-2">
            <Wand2 className="h-4 w-4" />
            <span className="hidden sm:inline">AI Vositalar</span>
          </TabsTrigger>
        </TabsList>

        {/* Universities Tab */}
        <TabsContent value="universities" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4 sm:flex-row">
                <div className="flex-1">
                  <Input
                    placeholder="Universitet nomi bo'yicha qidirish..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    icon={<Search className="h-4 w-4" />}
                  />
                </div>
                <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                  <SelectTrigger className="w-full sm:w-48">
                    <Globe className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Davlat" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Barcha davlatlar</SelectItem>
                    <SelectItem value="AQSh">🇺🇸 AQSh</SelectItem>
                    <SelectItem value="Buyuk Britaniya">🇬🇧 Buyuk Britaniya</SelectItem>
                    <SelectItem value="Germaniya">🇩🇪 Germaniya</SelectItem>
                    <SelectItem value="Janubiy Koreya">🇰🇷 Janubiy Koreya</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* University List */}
          <div className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
              </div>
            ) : filteredUniversities.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-surface-500">Universitetlar topilmadi</p>
                </CardContent>
              </Card>
            ) : (
              filteredUniversities.map((university) => (
                <UniversityCard
                  key={university.id}
                  university={university}
                  onApply={async () => {
                    try {
                      // TODO: Navigate to application form
                      toast.info(`${university.name} ga ariza sahifasi ochilmoqda...`);
                    } catch (error) {
                      toast.error(getErrorMessage(error));
                    }
                  }}
                  onSave={() => toast.success("Saqlandi!")}
                />
              ))
            )}
          </div>
        </TabsContent>

        {/* Scholarships Tab */}
        <TabsContent value="scholarships" className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
            </div>
          ) : scholarships.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-surface-500">Grantlar topilmadi</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {scholarships.map((scholarship) => (
                <ScholarshipCard key={scholarship.id} scholarship={scholarship} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Applications Tab */}
        <TabsContent value="applications" className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
            </div>
          ) : applications.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-surface-500">Arizalar mavjud emas</p>
              </CardContent>
            </Card>
          ) : (
            applications.map((app) => (
            <Card key={app.id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-xl text-white">
                      🏛️
                    </div>
                    <div>
                      <h3 className="font-semibold text-surface-900 dark:text-white">
                        {app.university?.name || (typeof app.university === 'string' ? app.university : 'Unknown')}
                      </h3>
                      <p className="text-sm text-surface-500">{app.program}</p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      app.status === "accepted"
                        ? "success"
                        : app.status === "submitted"
                        ? "default"
                        : "secondary"
                    }
                  >
                    {app.status === "accepted"
                      ? "✅ Qabul qilindi"
                      : app.status === "submitted"
                      ? "📤 Yuborildi"
                      : "⏳ Jarayonda"}
                  </Badge>
                </div>

                {app.documents_total > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-surface-500">Hujjatlar</span>
                      <span className="font-medium">
                        {app.documents_completed}/{app.documents_total}
                      </span>
                    </div>
                    <Progress
                      value={(app.documents_completed / app.documents_total) * 100}
                      className="mt-2 h-2"
                    />
                  </div>
                )}

                {app.deadline && (
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-surface-500">
                      Muddat: {new Date(app.deadline).toLocaleDateString("uz-UZ")}
                    </span>
                  <Button size="sm" variant="outline">
                    Batafsil
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  </div>
                )}
              </CardContent>
            </Card>
            ))
          )}
        </TabsContent>

        {/* AI Tools Tab */}
        <TabsContent value="tools" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Motivation Letter Generator */}
            <Card className="cursor-pointer transition-all hover:border-purple-300 hover:shadow-lg">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white">
                    <FileText className="h-7 w-7" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold text-surface-900 dark:text-white">
                      AI Motivation Letter
                    </h3>
                    <p className="text-sm text-surface-500">
                      Universitetga mos motivatsion xat yarating
                    </p>
                  </div>
                </div>
                <Button className="mt-4 w-full" variant="gradient">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Yaratish
                </Button>
              </CardContent>
            </Card>

            {/* Visa Q&A */}
            <Card className="cursor-pointer transition-all hover:border-cyan-300 hover:shadow-lg">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white">
                    <Plane className="h-7 w-7" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold text-surface-900 dark:text-white">
                      AI Visa Yordam
                    </h3>
                    <p className="text-sm text-surface-500">
                      Viza savollari va hujjatlar bo'yicha yordam
                    </p>
                  </div>
                </div>
                <Button className="mt-4 w-full" variant="outline">
                  <Sparkles className="mr-2 h-4 w-4" />
                  So'rashni boshlash
                </Button>
              </CardContent>
            </Card>

            {/* University Finder */}
            <Card className="cursor-pointer transition-all hover:border-green-300 hover:shadow-lg">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white">
                    <Search className="h-7 w-7" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold text-surface-900 dark:text-white">
                      AI University Finder
                    </h3>
                    <p className="text-sm text-surface-500">
                      Profilingizga mos universitetlarni toping
                    </p>
                  </div>
                </div>
                <Button className="mt-4 w-full" variant="outline">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Qidirish
                </Button>
              </CardContent>
            </Card>

            {/* Interview Practice */}
            <Card className="cursor-pointer transition-all hover:border-amber-300 hover:shadow-lg">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white">
                    <Users className="h-7 w-7" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold text-surface-900 dark:text-white">
                      AI Interview Practice
                    </h3>
                    <p className="text-sm text-surface-500">
                      Universitet intervyusiga tayyorlaning
                    </p>
                  </div>
                </div>
                <Button className="mt-4 w-full" variant="outline">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Mashq qilish
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}













