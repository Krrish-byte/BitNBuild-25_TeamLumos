import React, { useState, useEffect } from 'react';
import { AuthComponent } from './components/AuthComponent';
import { FreelancerDashboard } from './components/FreelancerDashboard';
import { ClientDashboard } from './components/ClientDashboard';
import { ProjectBrowser } from './components/ProjectBrowser';
import { ProjectDetails } from './components/ProjectDetails';
import { ProfileBuilder } from './components/ProfileBuilder';
import  ChatInterface  from './components/ChatInterface';
import { FreelancerProfile } from './components/FreelancerProfile';

export type UserType = 'freelancer' | 'client';

export interface User {
  id: string;
  name: string;
  email: string;
  type: UserType;
  university?: string;
  skills?: string[];
  verified?: boolean;
  isOnline?: boolean;
  avatar?: string;
  portfolio?: Project[];
  endorsements?: { [skill: string]: number };
  rating?: number;
  completedProjects?: number;
  bio?: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  skills: string[];
  budget: number;
  deadline: Date;
  status: 'open' | 'in-progress' | 'completed' | 'cancelled';
  clientId: string;
  freelancerId?: string;
  bids?: Bid[];
  progress?: number;
  lastUpdate?: string;
  createdAt: Date;
}

export interface Bid {
  id: string;
  freelancerId: string;
  projectId: string;
  message: string;
  amount: number;
  isQuickBid: boolean;
  submittedAt: Date;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  emoji?: string;
  timestamp: Date;
}

type ViewType = 'auth' | 'freelancer-dashboard' | 'client-dashboard' | 'project-browser' | 'project-details' | 'profile' | 'chat' | 'buzz-board' | 'freelancer-profile';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewType>('auth');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [selectedFreelancer, setSelectedFreelancer] = useState<User | null>(null);

  // Mock data for demonstration
  const [projects, setProjects] = useState<Project[]>([
    {
      id: '1',
      title: 'Build a Modern E-commerce Website',
      description: 'Need a React-based e-commerce site with payment integration and admin dashboard.',
      skills: ['React', 'Node.js', 'MongoDB', 'Payment Integration'],
      budget: 1500,
      deadline: new Date('2024-01-15'),
      status: 'open',
      clientId: 'client1',
      bids: [],
      createdAt: new Date('2023-12-01'),
    },
    {
      id: '2',
      title: 'Logo Design for Tech Startup',
      description: 'Modern, minimalist logo design for a AI-focused startup. Need multiple variations.',
      skills: ['Logo Design', 'Branding', 'Adobe Illustrator'],
      budget: 500,
      deadline: new Date('2023-12-20'),
      status: 'in-progress',
      clientId: 'client2',
      freelancerId: 'freelancer1',
      progress: 75,
      lastUpdate: 'Logo concepts approved, working on final versions',
      createdAt: new Date('2023-11-25'),
    },
    {
      id: '3',
      title: 'Mobile App Development',
      description: 'Create a cross-platform mobile app for a social networking platform.',
      skills: ['React Native', 'Firebase', 'iOS', 'Android'],
      budget: 2500,
      deadline: new Date('2024-02-01'),
      status: 'open',
      clientId: 'client1',
      bids: [],
      createdAt: new Date('2023-12-05'),
    },
    {
      id: '4',
      title: 'Video Editor for YouTube Channel',
      description: 'Edit weekly vlogs and promotional videos for a growing YouTube channel.',
      skills: ['Video Editing', 'Adobe Premiere Pro', 'After Effects'],
      budget: 800,
      deadline: new Date('2024-01-10'),
      status: 'open',
      clientId: 'client2',
      bids: [],
      createdAt: new Date('2023-12-02'),
    },
    {
      id: '5',
      title: 'Blog Writer for Tech Blog',
      description: 'Write engaging articles on various tech topics, including AI, blockchain, and software development.',
      skills: ['Content Writing', 'SEO', 'WordPress'],
      budget: 300,
      deadline: new Date('2023-12-25'),
      status: 'open',
      clientId: 'client1',
      bids: [],
      createdAt: new Date('2023-11-30'),
    },
  ]);

  const [users, setUsers] = useState<User[]>([
    {
      id: 'freelancer1',
      name: 'Alex Chen',
      email: 'alex.chen@stanford.edu',
      type: 'freelancer',
      university: 'Stanford University',
      skills: ['React', 'TypeScript', 'UI/UX Design', 'Node.js'],
      verified: true,
      isOnline: true,
      rating: 4.8,
      completedProjects: 23,
      endorsements: { 'React': 15, 'TypeScript': 12, 'UI/UX Design': 18 },
      bio: 'A passionate frontend developer with a knack for creating beautiful and intuitive user interfaces. I have a strong background in React and TypeScript, and I am always eager to learn new technologies.'
    },
    {
      id: 'freelancer2',
      name: 'Sarah Kim',
      email: 'sarah.kim@mit.edu',
      type: 'freelancer',
      university: 'MIT',
      skills: ['Logo Design', 'Branding', 'Adobe Creative Suite', 'Motion Graphics'],
      verified: true,
      isOnline: false,
      rating: 4.9,
      completedProjects: 31,
      endorsements: { 'Logo Design': 22, 'Branding': 19, 'Adobe Creative Suite': 25 },
      bio: 'A creative designer with a passion for branding and visual storytelling. I specialize in creating memorable logos and brand identities that resonate with audiences.'
    },
    {
      id: 'freelancer3',
      name: 'David Lee',
      email: 'david.lee@berkeley.edu',
      type: 'freelancer',
      university: 'UC Berkeley',
      skills: ['Python', 'Data Science', 'Machine Learning', 'TensorFlow'],
      verified: true,
      isOnline: true,
      rating: 4.7,
      completedProjects: 15,
      endorsements: { 'Python': 20, 'Data Science': 18, 'Machine Learning': 15 },
      bio: 'A data scientist with a strong background in machine learning and statistical analysis. I am passionate about using data to solve complex problems and drive business insights.'
    },
    {
      id: 'freelancer4',
      name: 'Maria Garcia',
      email: 'maria.garcia@nyu.edu',
      type: 'freelancer',
      university: 'New York University',
      skills: ['Content Writing', 'Copywriting', 'SEO', 'WordPress'],
      verified: true,
      isOnline: false,
      rating: 4.8,
      completedProjects: 42,
      endorsements: { 'Content Writing': 30, 'SEO': 25, 'Copywriting': 28 },
      bio: 'A versatile writer with a passion for creating engaging and informative content. I specialize in writing blog posts, articles, and website copy that drives traffic and conversions.'
    },
    {
      id: 'client1',
      name: 'Tech Innovations Inc',
      email: 'hiring@techinnovations.com',
      type: 'client',
      verified: true,
      isOnline: true,
    },
    {
      id: 'client2',
      name: 'Creative Solutions LLC',
      email: 'contact@creativesolutions.com',
      type: 'client',
      verified: true,
      isOnline: false,
    },
  ]);

  const handleCreateProject = (project: Omit<Project, 'id' | 'clientId' | 'createdAt' | 'status' | 'bids'>) => {
    const newProject: Project = {
      ...project,
      id: Date.now().toString(),
      clientId: currentUser!.id,
      createdAt: new Date(),
      status: 'open',
      bids: [],
      budget: Number(project.budget),
      deadline: new Date(project.deadline),
    };
    setProjects(prev => [newProject, ...prev]);
  };

  const handleLogin = (userData: User) => {
    setCurrentUser(userData);
    if (userData.type === 'freelancer') {
      setCurrentView('freelancer-dashboard');
    } else {
      setCurrentView('client-dashboard');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('auth');
  };

  const handleViewProject = (project: Project) => {
    setSelectedProject(project);
    setCurrentView('project-details');
  };

  const handleStartChat = (userId: string) => {
    setSelectedChat(userId);
    setCurrentView('chat');
  };

  const handleAcceptBid = (projectId: string, freelancerId: string) => {
    setProjects(prevProjects =>
      prevProjects.map(p =>
        p.id === projectId ? { ...p, status: 'in-progress', freelancerId } : p
      )
    );
  };

  const handleViewFreelancer = (freelancer: User) => {
    setSelectedFreelancer(freelancer);
    setCurrentView('freelancer-profile');
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'auth':
        return <AuthComponent onLogin={handleLogin} />;
      
      case 'freelancer-dashboard':
        return (
          <FreelancerDashboard
            user={currentUser!}
            projects={projects}
            onViewProject={handleViewProject}
            onNavigate={setCurrentView}
            onStartChat={handleStartChat}
            onLogout={handleLogout}
          />
        );
      
      case 'client-dashboard':
        return (
          <ClientDashboard
            user={currentUser!}
            projects={projects.filter(p => p.clientId === currentUser?.id)}
            onViewProject={handleViewProject}
            onNavigate={setCurrentView}
            onStartChat={handleStartChat}
            onLogout={handleLogout}
            onCreateProject={handleCreateProject}
          />
        );
      
      case 'project-browser':
        return (
          <ProjectBrowser
            projects={projects}
            currentUser={currentUser!}
            onViewProject={handleViewProject}
            onNavigate={setCurrentView}
            users={users}
            onViewFreelancer={handleViewFreelancer}
            onStartChat={handleStartChat}
          />
        );
      
      case 'project-details':
        return (
          <ProjectDetails
            project={selectedProject!}
            currentUser={currentUser!}
            onNavigate={setCurrentView}
            onStartChat={handleStartChat}
            users={users}
            onAcceptBid={handleAcceptBid}
          />
        );
      
      case 'profile':
        return (
          <ProfileBuilder
            user={currentUser!}
            onNavigate={setCurrentView}
            onUserUpdate={setCurrentUser}
          />
        );
      
      case 'chat':
        return (
          <ChatInterface
            currentUser={currentUser!}
            selectedUserId={selectedChat!}
            users={users}
            onNavigate={setCurrentView}
          />
        );
      
      case 'buzz-board':
        return (
          <BuzzBoard
            projects={projects}
            users={users}
            currentUser={currentUser!}
            onViewProject={handleViewProject}
            onNavigate={setCurrentView}
            onViewFreelancer={handleViewFreelancer}
            onStartChat={handleStartChat}
          />
        );

      case 'freelancer-profile':
        return (
          <FreelancerProfile
            freelancer={selectedFreelancer!}
            onNavigate={setCurrentView}
            onStartChat={handleStartChat}
          />
        );
      
      default:
        return <AuthComponent onLogin={handleLogin} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {renderCurrentView()}
    </div>
  );
}