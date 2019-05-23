Summary: Mendel's Accountant Web UI
Name: mendel-web-ui
Version: %{getenv:VERSION}
Release: %{getenv:RELEASE}
Epoch: 1
License: GNU GPL v3
Source: mendel-web-ui-%{version}.tar.gz
Packager: Bruce Potter
#Vendor: ?
#Distribution: ?
Prefix: /usr/local
#BuildRoot: ?
BuildArch: x86_64
Requires: mendel-go >= 1.2.2

%description
The UI for Mendel's Accountant, which performs biologically realistic genetic evolution simulation.

%prep
%setup -q

%build
# This phase is done in ~/rpmbuild/BUILD/mendel-web-ui-1.0.0. All of the tarball source has been unpacked there and
# is in the same file structure as it is in the git repo. $RPM_BUILD_DIR has a value like ~/rpmbuild/BUILD
#env | grep -i build
# Need to play some games to get our src dir under a GOPATH
rm -f ../src; ln -s . ../src
mkdir -p ../github.com/genetic-algorithms
rm -f ../github.com/genetic-algorithms/mendel-web-ui; ln -s ../../mendel-web-ui-%{version} ../github.com/genetic-algorithms/mendel-web-ui

GOPATH=$RPM_BUILD_DIR scripts/build_go

%install
# The install phase puts all of the files in the paths they should be in when the binary rpm is installed on a system.
# It is run in the same dir as the build above was done: ~/rpmbuild/BUILD/mendel-web-ui-1.0.0
# The $RPM_BUILD_ROOT is a simulated root file system and usually has a value like: ~/rpmbuild/BUILDROOT/mendel-web-ui-1.0.0-1.x86_64
# Following the LSB Filesystem Hierarchy Standard: https://refspecs.linuxfoundation.org/FHS_3.0/fhs-3.0.pdf
rm -rf $RPM_BUILD_ROOT
mkdir -p $RPM_BUILD_ROOT%{prefix}/bin $RPM_BUILD_ROOT%{prefix}/share/mendel-web-ui $RPM_BUILD_ROOT%{prefix}/mendel-web-ui $RPM_BUILD_ROOT/etc/init
cp cmd/server/mendel-web-ui $RPM_BUILD_ROOT%{prefix}/bin
cp LICENSE COPYRIGHT $RPM_BUILD_ROOT%{prefix}/share/mendel-web-ui
cp -a static rollup.config.js *.json $RPM_BUILD_ROOT%{prefix}/mendel-web-ui
cp pkg/upstart/mendel-web-ui.conf $RPM_BUILD_ROOT/etc/init

%files
# This section selects which dirs/files from the binary rpm should be put on the system.
#%defattr(-, root, root)
#%doc LICENSE COPYRIGHT
%{prefix}/bin/mendel-web-ui
%{prefix}/share/mendel-web-ui
%{prefix}/mendel-web-ui
/etc/init/mendel-web-ui.conf

%post
mkdir -p /var/log/mendel-web-ui /usr/local/var/run/mendel-web-ui/output/jobs  # main.go will create the database dir
# this is needed because these dirs are created by root during install, but will be written to by whatever user runs the web ui
chmod 777 /var/log/mendel-web-ui /usr/local/var/run/mendel-web-ui /usr/local/var/run/mendel-web-ui/output /usr/local/var/run/mendel-web-ui/output/jobs
initctl stop mendel-web-ui > /dev/null 2>&1 || true
initctl reload-configuration
initctl start mendel-web-ui

%preun
if [ "$1" = "0" ]; then
  initctl stop mendel-web-ui || true
fi


%clean
# This step happens *after* the %files packaging
rm -rf $RPM_BUILD_ROOT
