import SwiftUI

struct ResumeView: View {
    @State private var showEditor = false

    var body: some View {
        NavigationStack {
            List {
                Section {
                    Button { showEditor = true } label: {
                        Label("Create a new resume", systemImage: "plus.circle.fill")
                            .foregroundStyle(.brightfolioTeal)
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
                        .foregroundStyle(.brightfolioTeal)
                }
                Section("Recent letters") {
                    NativeEmptyStateRow(icon: "envelope", title: "No cover letters yet", detail: "Create one from a job description or resume.")
                }
            }
            .navigationTitle("Cover Letters")
        }
    }
}

struct StudyView: View {
    var body: some View {
        NavigationStack {
            List {
                Section {
                    Label("Create a study set", systemImage: "plus.circle.fill")
                        .foregroundStyle(.brightfolioTeal)
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
                            .foregroundStyle(.brightfolioTeal)
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
                            .foregroundStyle(.brightfolioTeal)
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
            .navigationTitle("Account")
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
