import SwiftUI

struct ResumeView: View {
    @State private var showEditor = false

    var body: some View {
        NavigationStack {
            List {
                Section {
                    Button { showEditor = true } label: {
                        Label("Create a new resume", systemImage: "plus.circle.fill")
                            .foregroundStyle(Color.brightfolioTeal)
                    }
                }
                Section("Recent resumes") {
                    NativeEmptyStateRow(icon: "doc.text", title: "No resumes yet", detail: "Your saved resumes will appear here.")
                }
                Section("Tools") {
                    Label("ATS check", systemImage: "checkmark.seal")
                    Label("Templates", systemImage: "square.grid.2x2")
                    Label("Resume preview", systemImage: "eye")
                }
            }
            .navigationTitle("Resume")
            .sheet(isPresented: $showEditor) { NativeResumeEditorView() }
        }
    }
}

struct NativeResumeEditorView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var fullName = ""
    @State private var headline = ""

    var body: some View {
        NavigationStack {
            Form {
                Section("Start with the basics") {
                    TextField("Full name", text: $fullName)
                    TextField("Professional headline", text: $headline)
                }
                Section("Next") {
                    Label("Experience", systemImage: "briefcase")
                    Label("Education", systemImage: "graduationcap")
                    Label("Skills", systemImage: "star")
                }
            }
            .navigationTitle("New resume")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Close") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) { Button("Save") { dismiss() }.fontWeight(.semibold) }
            }
        }
    }
}

struct LettersView: View {
    var body: some View {
        NavigationStack {
            List {
                Section {
                    Label("Create a tailored cover letter", systemImage: "plus.circle.fill")
                        .foregroundStyle(Color.brightfolioTeal)
                }
                Section("Recent letters") {
                    NativeEmptyStateRow(icon: "envelope", title: "No cover letters yet", detail: "Create one from a job description or resume.")
                }
            }
            .navigationTitle("Cover Letters")
        }
    }
}

struct ExploreView: View {
    var body: some View {
        NavigationStack {
            List {
                Section("Discover") {
                    Label("AI career guidance", systemImage: "sparkles")
                    Label("Resume templates", systemImage: "doc.text")
                    Label("Interview practice", systemImage: "person.2")
                }
                Section("Study") {
                    Label("Salesforce Marketing Cloud", systemImage: "cloud.fill")
                    Label("Apex and LWC", systemImage: "chevron.left.forwardslash.chevron.right")
                    Label("Interview prep", systemImage: "lightbulb")
                }
            }
            .navigationTitle("Explore")
        }
    }
}

struct CreateView: View {
    @State private var showResumeEditor = false

    var body: some View {
        NavigationStack {
            List {
                Section("Create something new") {
                    Button { showResumeEditor = true } label: {
                        Label("Resume", systemImage: "doc.text.fill")
                    }
                    Label("Cover letter", systemImage: "envelope.fill")
                    Label("Study set", systemImage: "graduationcap.fill")
                }
            }
            .navigationTitle("Create")
            .sheet(isPresented: $showResumeEditor) { NativeResumeEditorView() }
        }
    }
}

struct LibraryView: View {
    var body: some View {
        NavigationStack {
            List {
                Section("Resumes") {
                    NativeEmptyStateRow(icon: "doc.text", title: "No resumes yet", detail: "Your saved resumes will appear here.")
                }
                Section("Cover letters") {
                    NativeEmptyStateRow(icon: "envelope", title: "No cover letters yet", detail: "Your saved letters will appear here.")
                }
                Section("Study sets") {
                    NativeEmptyStateRow(icon: "books.vertical", title: "No study sets yet", detail: "Your saved study sets will appear here.")
                }
            }
            .navigationTitle("Library")
        }
    }
}

struct StudyView: View {
    var body: some View {
        NavigationStack {
            List {
                Section {
                    Label("Create a study set", systemImage: "plus.circle.fill")
                        .foregroundStyle(Color.brightfolioTeal)
                }
                Section("Practice") {
                    Label("Flashcards", systemImage: "rectangle.on.rectangle")
                    Label("Quiz", systemImage: "checkmark.circle")
                    Label("Performance", systemImage: "chart.bar.xaxis")
                }
                Section("Your library") {
                    NativeEmptyStateRow(icon: "books.vertical", title: "No study sets yet", detail: "Your saved sets will appear here.")
                }
            }
            .navigationTitle("Study")
        }
    }
}

struct AccountView: View {
    @EnvironmentObject private var appState: AppState

    var body: some View {
        NavigationStack {
            List {
                Section {
                    HStack(spacing: 14) {
                        Image(systemName: "person.crop.circle.fill")
                            .font(.system(size: 44))
                            .foregroundStyle(Color.brightfolioTeal)
                        VStack(alignment: .leading, spacing: 4) {
                            Text(appState.isSignedIn ? "Your account" : "Welcome to Brightfolio")
                                .font(.headline)
                            Text(appState.isSignedIn ? "Signed in" : "Sign in to sync your work")
                                .font(.subheadline)
                                .foregroundStyle(.secondary)
                        }
                    }
                    .padding(.vertical, 6)
                    if !appState.isSignedIn {
                        Button("Sign in") { appState.isSignedIn = true }
                            .foregroundStyle(Color.brightfolioTeal)
                    }
                }
                Section("Preferences") {
                    Toggle("Dark appearance", isOn: Binding(
                        get: { appState.colorScheme == .dark },
                        set: { appState.colorScheme = $0 ? .dark : .light }
                    ))
                }
                Section {
                    Label("Privacy", systemImage: "hand.raised")
                    Label("Help and support", systemImage: "questionmark.circle")
                }
            }
            .navigationTitle("Profile")
        }
    }
}

struct NativeEmptyStateRow: View {
    let icon: String
    let title: String
    let detail: String

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .foregroundStyle(.secondary)
                .frame(width: 28)
            VStack(alignment: .leading, spacing: 3) {
                Text(title).font(.subheadline.weight(.semibold))
                Text(detail).font(.caption).foregroundStyle(.secondary)
            }
        }
        .padding(.vertical, 5)
    }
}
